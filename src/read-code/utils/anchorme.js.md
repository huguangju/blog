---
title: Anchorme.js 的 URL 检测及性能优化
date: 2025-09-18
category:
  - 读源码
tag:
  - utils
---

[`Anchorme.js`](https://github.com/alexcorvi/anchorme.js) 是一个轻量级、高性能的 JS 库，专门用于检测文本中的 <u>URL</u>、<u>电子邮件</u>和<u>其他链接</u>，并将其转换为 **可点击的 HTML 锚元素**（使链接具有交互性，同时不破坏现有 HTML 结构）。

该库特别适用于聊天应用、评论系统、社交媒体等需要处理用户生成内容的场景。


## 主要功能
1. **链接检测与转换**：基于极轻量、超高性能的正则引擎，自动识别文本中的 URL、Email、FTP、IP、文件路径等并生成标准 `<a>` 标签
2. **智能标点处理**：准确判断括号、引号是否为链接的一部分，保证边界精确
3. **HTML 上下文感知**：避免重复链接或破坏现有 HTML 属性，跳过已存在的 `<a>` 标签
4. **可扩展规则**：支持自定义转换规则，可扩展识别 `hashtag`、`@提及`等任意自定义模式

<!-- more -->

## 入门指南
```typescript
// 安装
npm install anchorme

// 基本使用
import anchorme from 'anchorme';
const text = "访问 example.com 或发邮件到 user@example.com";
const result = anchorme(text);
// 输出：访问 <a href="http://example.com">example.com</a> 或发邮件到 <a href="mailto:user@example.com">user@example.com</a>
```

该库导出一个接受字符串或选项对象的函数。对于更高级的用法，可以自定义链接的转换方式：

```typescript
const text = `
  Visit our website at example.com
  Contact support@example.com for help
  Download our file at file:///c:/document.pdf
  Follow @user and #topic on social media
  Watch this video: https://youtube.com/watch?v=VIDEO_ID
`;
 
const result = anchorme({
  input: text,
  options: {
    // 为所有链接添加属性
    attributes: {
      target: "_blank",
      class: "auto-link"
    },
    // 截断长 URL
    truncate: 40,
    middleTruncation: true,
    // 排除文件路径
    exclude: string => anchorme.validate.file(string),
    // YouTube 和图像的特殊转换
    specialTransform: [
      {
        test: /youtube\.com\/watch\?v=/,
        transform: string => {
          const videoId = string.replace(/.*watch\?v\=(.*)$/, "$1");
          return `<div class="video-embed"><iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe></div>`;
        }
      }
    ]
  },
  // 自定义链接类型的扩展
  extensions: [
    {
      test: /@(\w|_)+/gi,
      transform: string => `<a href="/users/${string.substr(1)}" class="mention">${string}</a>`
    },
    {
      test: /#(\w|_)+/gi,
      transform: string => `<a href="/tags/${string.substr(1)}" class="hashtag">${string}</a>`
    }
  ]
});
```

## 工作原理

Anchorme.js 的核心流程是一个 **检测 → 验证 → 转换** 的流水线，基于 **URL检测算法**。


URL 检测看似简单、实则充满边界情况和挑战：

+ URL 可能被标点符号包围（如括号），需要判断是否属于 URL 本身。
+ 可能嵌套在 HTML 标签或属性中，需避免重复检测。
+ 存在看似是 URL 但实际无效的字符串（如 `not.a.url`）。
+ 国际化域名（IDN）和非拉丁字符增加复杂性。
+ 不同类型（HTTP、HTTPS、FTP、邮箱、文件路径）需要不同规则。


URL 检测由 `list()` 函数主导，采用以下流程：

### 1. **正则匹配检测**
> + 使用**单一、高度优化的正则表达式**扫描文本，识别潜在的 URL、邮箱、IP、文件路径等。
> + 这个正则表达式承担了 99% 的“重活”，是性能的关键。
>


URL检测的核心是 `src/regex.ts` 中定义的复杂正则表达式（使用复合正则表达式模式）。可以检测三种类型的链接：

```typescript
// 电子邮件模式
const email = `\\b(mailto:)?${emailAddress}@(${domain}|${ipv4})`;
 
// URL模式  
const url = `(${fqdn})${path}?`;
 
// 文件模式
const file = `(file:\\/\\/\\/)(?:[a-z]+:(?:\\/|\\\\)+)?([\\w.]+(?:[\\/\\\\]?)+)+`;
```



这些模式被组合成一个最终的正则表达式，它尝试使用后行断言（为了更好的性能），但对于不支持它们的浏览器会回退到替代方法：

```typescript
// 使用后行断言的首选方法
export const final1 = `(?<=\\b|_)((${email})|(${file})|(${url}))(\\b)?`;
 
// 不使用后行断言的回退方法
export const final2 = `((\\b)(${email})|(\\b)(${file})|(\\b)(${url}))(\\b)?`;
```

### 2. **括号与标点智能判断**
> + 计算尾随括号标点是否属于链接的一部分，避免错误包含或遗漏。
> + 例如：`http://example.com/page_(1)` 会正确保留括号，而 `(http://example.com)` 则不会把外层括号算进去。
>

Anchorme.js通过`checkParenthesis()`函数中的一个巧妙算法来解决这个问题：

```typescript
/**
 * 智能检查一个符号（如括号）是否应该被视为URL的一部分。
 *
 * 该函数通过分析目标字符串中开闭符号的平衡情况来做出判断。
 * 主要用于解决 "https://example.com/path(123)" 中右括号是否属于URL的问题。
 *
 * @param {string} opening - 开启符号，例如 '('。
 * @param {string} closing - 关闭符号，例如 ')'。
 * @param {string} target - 待检查的目标字符串（通常是检测到的URL）。
 * @param {string} nextChar - 目标字符串后的下一个字符。
 * @returns {boolean | undefined} 
 *   - 如果下一个字符是关闭符号且它属于目标字符串，则返回 `true`。
 *   - 如果下一个字符不是关闭符号，或它不属于目标字符串，则返回 `false`。
 *   - 在其他未明确处理的情况下，函数没有返回值（`undefined`）。
 */
export function checkParenthesis(
  opening: string,
  closing: string,
  target: string,
  nextChar: string
) {
  // 1. 快速失败 (Fail-Fast)：如果目标字符串后面的字符不是关闭符号，
  //    那么这个关闭符号就不可能属于目标字符串。直接返回 false。
  if (nextChar !== closing) {
    return false;
  }

  // 2. 平衡检查：如果下一个字符是关闭符号，需要进一步判断它是否是目标字符串中未闭合的开启符号的配对。
  
  // 如果开启符号和关闭符号是不同的（例如 '(' 和 ')'）
  // 我们通过分割字符串来计算开启符号和关闭符号的数量。

  // 开启符号的总数
  const openCount  = target.split(opening).length - 1;
  // 关闭符号的总数
  const closeCount = target.split(closing).length - 1;
  // 如果开启符号比关闭符号多一个，说明目标字符串内部有一个未闭合的开启符号，
  // 那么后面的这个关闭符号就是用来闭合它的，因此应该属于目标字符串。
  const isDifferentPair = openCount - closeCount === 1;

  // 如果开启符号和关闭符号是相同的（例如单引号 ' 或双引号 "）
  // 我们只需要检查目标字符串中该符号的总数是否为偶数。
  // 如果是偶数，说明内部符号都已配对，那么后面的这个符号是新的开始，不属于目标字符串。
  // 如果是奇数，说明内部有未配对的符号，那么后面的这个符号就是用来配对的，属于目标字符串。
  const isSameSymbolAndEvenCount = (opening === closing && openCount % 2 === 0);

  // 满足以上两个条件之一，就返回 true。
  if (isDifferentPair || isSameSymbolAndEvenCount) {
    return true;
  }

  // 对于其他所有情况（例如开闭符号数量相等，或开启符号少于关闭符号），
  // 这个关闭符号都不属于目标字符串。函数在此处没有显式 return，将返回 undefined。
}
```

### 3. **HTML 上下文检查**
> + 检测匹配到的字符串是否位于：
>     - 已有的 `<a>` 标签内；
>     - HTML 属性值中（如 `href="..."`）；
> + 如果是，则**跳过处理**，防止破坏现有结构或重复嵌套。
>

**1. HTML属性检测**

检查潜在的URL是否位于自然包含URL的HTML属性中：

```typescript
/**
 * 检查给定的字符串片段是否处于一个HTML或CSS属性值的内部。
 *
 * 该函数通过正则表达式匹配，判断文本是否位于等待引号闭合的属性值中。
 * 这对于防止在HTML/CSS代码中对已经是链接的URL进行重复处理至关重要。
 *
 * @param {string} prevFragment - 从文本开头到当前位置的片段。
 * @returns {boolean} 
 *   - 如果片段处于属性值内部，则返回 `true`。
 *   - 否则，返回 `false`。
 */
export function isInsideAttribute(prevFragment: string) {
  return (
    // 情况1: 匹配标准的HTML属性 (如 href="...", src='...')
    /\s[a-z0-9-]+=('|")$/i.test(prevFragment) || // 标准HTML属性
    // 情况2: 匹配CSS的 url() 函数 (如 background-image: url('...'))
    /: ?url\(('|")?$/i.test(prevFragment) // CSS url()函数
  );
}
```

这可以防止在`href="https://example.com"`等属性中重复链接URL。



**2. 锚标签内容检测**

检查URL是否已经是锚标签的内容：

```typescript
/**
 * 检查一个目标字符串是否位于 `<a>` 标签内部。
 *
 * 该函数通过一个精巧的正则表达式，判断在完整输入字符串中，指定的目标字符串
 * 是否被包裹在一对 `<a>` 和 `</a>` 标签之间。它主要用于防止对已经是链接的文本
 * 进行重复处理。
 *
 * @param {string} target - 需要检查的目标字符串（通常是一个URL）。
 * @param {string} fullInput - 包含目标字符串的完整输入文本。
 * @param {number} targetEnd - 目标字符串在完整输入文本中的结束位置索引。
 * @returns {boolean} 
 *   - 如果目标字符串位于 `<a>` 标签内部，则返回 `true`。
 *   - 否则，返回 `false`。
 */
export function isInsideAnchorTag(
  target: string,
  fullInput: string,
  targetEnd: number
) {
  // 1. 转义目标字符串中的正则特殊字符
  // 例如，将 "example.com/path?a=1" 中的 "." 和 "?" 转义为 "\." 和 "\?"
  // 这是为了确保它们在正则表达式中被当作普通字符匹配。
  const escapedTarget = target.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");

  // 2. 构建核心正则表达式
  // 这个正则表达式是整个逻辑的核心，使用了零宽断言(zero-width assertions)来进行复杂的位置判断。
  const regex = new RegExp(
    // 正向先行断言 (Positive Lookahead):
    // 确保从字符串开头到目标字符串的这段文本中，至少存在一个 "<a" (表示a标签的开始)。
    `(?=(<a))` +

    // 负向先行断言 (Negative Lookahead):
    // 这是最关键的部分，它确保在 "<a" 标签之后、目标字符串之前，
    // 不会出现任何 `</a>` 标签。
    // 分解:
    //   (?!          - 开始负向先行断言
    //     ([\s\S]*)  - 匹配任意字符（包括换行符）零次或多次，尽可能多匹配。
    //     (<\/a>)    - 匹配一个 `</a>` 结束标签。
    //     (${escapedTarget}) - 匹配目标字符串。
    //   )            - 结束负向先行断言
    `(?!([\\s\\S]*)(<\\/a>)(${escapedTarget}))` +

    // [\s\S]*?      - 非贪婪地匹配任意字符，直到找到下一个模式。
    //                 这部分会消耗掉从字符串开头到目标字符串的所有字符。
    `[\\s\\S]*?` +

    // (${escapedTarget}) - 捕获目标字符串本身。
    `(${escapedTarget})` +

    // 正向先行断言 (Positive Lookahead):
    // 确保目标字符串后面不是一个引号（单引号或双引号）。
    // 这是为了防止误判属性值中的URL，例如 href="https://example.com" 中的 "https://example.com。
    // 因为如果URL在引号内，它很可能是属性值，而不是标签内的文本内容。
    `(?!"|')`,

    // "gi" - 全局(global)和不区分大小写(insensitive)的匹配模式。
    "gi"
  );

  // 3. 执行逻辑 (函数体中省略的部分)
  // 尽管函数体被省略，但基于此正则的设计，其执行逻辑应为：
  // - 使用 `regex.test(fullInput)` 来检查完整输入字符串是否符合上述复杂的模式。
  // - 如果 `test()` 返回 `true`，说明找到了一个位于 `<a>` 标签内（且在 `</a>` 标签外）的目标字符串。
  // - 因此，函数的返回值应为 `regex.test(fullInput)` 的结果。
  
  // 例如，一个可能的完整实现可以是：
  // return regex.test(fullInput);
}
```

这可以防止创建嵌套链接，如`<a href="https://example.com">https://example.com</a>`。

### 4. TLD 与协议验证
> + 对无协议链接（如 `example.com`），会验证其顶级域名（TLD）是否在 IANA 官方列表中。
> + 同时验证端口号、IP 地址格式、邮箱域名等，**减少误报**。
>

```typescript
// 从字典文件中导入顶级域名(TLD)列表。
// 该列表通常是一个用竖线(|)连接的字符串，例如 "com|net|org|io|co.uk|..."
import { TLDs } from "./dictionary";

// 根据导入的TLD列表，动态构建一个正则表达式。
// 这个正则表达式用于验证一个字符串是否是一个有效的顶级域名。
//
// 正则表达式解析:
// ^           - 匹配字符串的开始位置
// (${TLDs})   - 将导入的TLD列表作为一个整体进行匹配。例如，如果TLDs是"com|net|org"，
//               这部分就会变成"(com|net|org)"，表示匹配"com"、"net"或"org"中的任意一个。
// $           - 匹配字符串的结束位置
// 'i'         - 不区分大小写的匹配模式 (case-insensitive)，允许匹配 "COM", "Org" 等。
let TLDsRgex = new RegExp(`^(${TLDs})$`, 'i');


// ... 在检测逻辑的后续部分 ...

// 1. 从解析结果中提取顶级域名(TLD)。
//    `result` 是一个包含了URL各部分解析信息的数组或对象。
//    `iidxes.url.TLD` 是一个索引数组，指向 `result` 中可能包含TLD的位置。
//    这里使用 `||` 操作符，是为了提供一种 fallback 机制：
//    - 首先尝试从 `result[iidxes.url.TLD[0]]` 获取TLD。
//    - 如果第一个位置不存在（例如解析失败），则尝试从 `result[iidxes.url.TLD[1]]` 获取。
let tld = result[iidxes.url.TLD[0]] || result[iidxes.url.TLD[1]];

// 2. 这是一个复合条件判断，用于决定是否跳过当前的URL候选。
//    它通过一系列检查来排除那些不应该被自动链接的无效或特殊情况的URL。
if (
  tld &&  // 条件1: 确保我们已经成功提取到了一个TLD。如果TLD不存在，则无需继续检查。

  (!protocol) &&  // 条件2: 确保URL没有显式的协议头 (如 "http://" 或 "https://")。
                  // 这通常意味着这是一个相对链接或需要我们进一步验证的简写URL。

  (!result[iidxes.email.protocol]) && // 条件3: 确保这不是一个电子邮件地址。
                                      // 如果解析结果中包含邮件协议信息（如 "mailto:"），则跳过。

  // 条件4: 这是核心的TLD有效性检查。
  (
    !tld.startsWith("xn--") &&  // a. 排除国际化域名(IDN)的Punycode编码前缀。
                                //    "xn--" 开头的TLD是IDN的编码形式（如 "xn--fiqs8s" 代表 "中国"）。
                                //    这些编码后的TLD通常不在标准TLD列表中，所以需要特殊处理或跳过。

    !TLDsRgex.test(tld)         // b. 使用前面构建的正则表达式来验证提取出的TLD是否在有效TLD列表中。
                                //    如果 `test()` 返回 `false`，说明该TLD无效。
  )
) {
  // 如果以上所有条件都满足，说明这是一个没有协议头、不是邮件地址、
  // 且包含无效TLD的字符串。因此，我们将其视为非URL，并跳过后续的处理逻辑。
  continue; // 跳过无效TLD。
}

// ... 如果代码执行到这里，说明TLD验证通过，将继续进行后续的URL处理 ...
```

### 5. **链接组件解析**
> + 将验证通过的链接拆解为：
>     - 协议（protocol）
>     - 主机（host）
>     - 路径（path）
>     - 查询参数（query）
>     - 哈希（hash）
> + 以便后续精确生成 `<a>` 标签。
>

```typescript
// 检查解析结果，确认当前匹配项是否为一个URL。
// `result` 是解析器的输出，`iidxes.isURL` 是一个布尔值或指示位，
// 如果为真，则表示 `string` 变量中包含一个有效的URL。
if (result[iidxes.isURL]) {
  // 1. 提取主机名 (Hostname)
  //    从解析结果中获取主机名，主机名可能存放在结果数组的不同位置。
  //    这里使用 `||` 操作符提供了多层级的 fallback 机制，
  //    依次尝试从三个可能的位置获取主机名，确保在不同情况下都能正确拿到。
  //    主机名通常是 "example.com" 或 "www.example.co.uk" 这样的值。
  const host = result[iidxes.url.host[0]] || result[iidxes.url.host[1]] || result[iidxes.url.host[2]];

  // 2. 提取路径 (Path)
  //    使用正则表达式从原始 `string` 中捕获URL的路径部分。
  //    正则解析:
  //      (?:[^\/:]|])      - 非捕获组，匹配一个非斜杠、非冒号的字符，或一个右方括号 ']'。
  //                         这是为了避免匹配到协议部分(如 'http://')或IPv6地址的结尾。
  //      (                 - 开始捕获组，这是我们要提取的路径。
  //        (?:\/[^?#\s]+)+ - 非捕获组，匹配一个斜杠 '/' 后跟一个或多个非(问号、井号、空格)的字符。
  //                         `+` 表示这个模式可以重复，从而匹配完整的路径，如 '/path/to/resource'。
  //      )                 - 结束捕获组。
  //    `|| []` 是一个安全措施，如果没有匹配到任何路径，`match` 会返回 `null`，
  //    `null || []` 会得到一个空数组，避免后续 `[1]` 访问时报错。
  //    `[1]` 取出匹配结果中的第一个捕获组内容。
  const path = (string.match(/(?:[^\/:]|])((?:\/[^?#\s]+)+)/) || [])[1];

  // 3. 提取查询参数 (Query)
  //    使用正则表达式从原始 `string` 中捕获URL的查询参数部分。
  //    正则解析:
  //      (?:\?) - 非捕获组，匹配一个问号 '?'。
  //      (      - 开始捕获组，这是我们要提取的查询参数。
  //        [^#]+ - 匹配一个或多个非井号 '#' 的字符。
  //      )      - 结束捕获组。
  //      \b     - 单词边界，确保匹配的完整性。
  const query = (string.match(/(?:\?)([^#]+)\b/) || [])[1];

  // 4. 提取片段 (Fragment/Hash)
  //    使用正则表达式从原始 `string` 中捕获URL的片段（哈希）部分。
  //    正则解析:
  //      (?:#) - 非捕获组，匹配一个井号 '#'。
  //      (     - 开始捕获组，这是我们要提取的片段。
  //        .+  - 匹配一个或多个任意字符。
  //      )     - 结束捕获组。
  //      \b    - 单词边界。
  const fragment = (string.match(/(?:#)(.+)\b/) || [])[1];

  // 5. 处理IPv6地址
  //    如果前面没有成功提取到主机名 (`host === undefined`)，则尝试匹配IPv6地址。
  //    这通常发生在URL以IPv6地址直接作为主机名的情况，如 `http://[::1]/`。
  //    正则解析:
  //      \/\/   - 匹配 "//"。
  //      \[     - 匹配一个左方括号 '['。
  //      (      - 开始捕获组，捕获IPv6地址内容。
  //        (?:(?:[a-f\d:]+:+)+[a-f\d]+) - 复杂的模式，用于匹配标准的IPv6地址格式。
  //      )      - 结束捕获组。
  //      \]     - 匹配一个右方括号 ']'。
  const ipv6 = host === undefined ? (string.match(/\/\/\[((?:(?:[a-f\d:]+:+)+[a-f\d]+))\]/) || [])[1] : undefined;

  // ... 在后续代码中，可以使用 host, path, query, fragment, ipv6 等变量
  //     来构建一个完整的URL对象或进行其他处理。
}
```



这样，Anchorme.js 在保证**速度**的同时，也兼顾了**准确性**与**安全性**，不会误伤 HTML 结构，也不会把“example.com”这种非链接文本错误转换。

## 链接转换
默认情况下，anchorme.js 将检测到的链接直接转换为标准 HTML 锚标签。

会根据链接类型自动添加适当的协议：如 URL→http://、邮件→mailto:、文件→file:///。

在保持合理默认值的同时支持广泛的自定义，转换过程始于使用 `src/regex.ts` 中定义的正则表达式检测输入文本中的链接。一旦识别到链接，库会提取其属性（如协议、主机、路径等），然后应用选项中指定的转换规则。

### 自定义转换选项
+ 添加HTML属性：支持静态配置（target/class/rel）或条件函数
+ 截断长链接：普通截断（设`truncate`数值）、中间截断（启`middleTruncation`）
+ 自定义协议：全局强制（如HTTPS）或条件函数适配（按链接内容区分）
+ 排除链接：通过函数（如排除`file:///`开头）或全局禁用（`exclude: true`）
+ 特殊转换：优先执行，支持自定义HTML（如YouTube→iframe、图片→img）



核心转换代码如下：

```typescript
/**
 * 将检测到的URL/邮箱等字符串转换为HTML <a> 标签
 * 支持协议补全、文本截断、自定义属性等功能，核心转换逻辑实现
 * @param {Partial<ListingProps> & { string: string }} input 输入对象
 *   - string: 待转换的原始字符串（如"example.com"、"test@mail.com"）
 *   - 其他属性: 元数据（如isEmail是否为邮箱、isFile是否为文件路径、protocol是否已有协议等）
 * @param {Partial<Options>} [options] 转换配置选项（可选）
 * @returns {string} 生成的<a>标签字符串
 */
export function transform(
	input: Partial<ListingProps> & { string: string },
	options?: Partial<Options>
): string {
	// 初始化转换所需的配置变量
	let protocol = ""; // 协议前缀（如"http://"、"mailto:"）
	let truncation = Infinity; // 截断长度（默认不截断）
	let attributes: { [key: string]: string | undefined | true } = {}; // <a>标签的自定义属性
	let truncateFromTheMiddle = false; // 是否从中间截断长链接

	// 1. 特殊转换处理（最高优先级）
	// 用于对特定URL进行定制化转换，如内部链接、特殊格式链接
	if (options && options.specialTransform) {
		// 遍历所有特殊转换规则
		for (let index = 0; index < options.specialTransform.length; index++) {
			const transformer = options.specialTransform[index];
			// 若当前字符串匹配规则的正则条件，则执行对应转换并返回结果
			if (transformer.test.test(input.string)) {
				return transformer.transform(input.string, input);
			}
		}
	}

	// 2. 排除逻辑处理
	// 满足排除条件的字符串不进行转换，直接返回原始值
	if (options && options.exclude) {
		// 通过applyOption处理排除条件（支持静态布尔值或动态函数判断）
		if (applyOption(input.string, input, options.exclude))
			return input.string;
	}

	// 3. 协议补全处理
	// 为无协议的URL自动添加合适的协议，或使用用户配置的协议
	if (options && options.protocol) {
		// 优先使用用户配置的协议（支持动态计算）
		protocol = applyOption(input.string, input, options.protocol);
	}
	// 若原始字符串已有协议（如input.protocol存在），则不重复添加
	else if (input.protocol) {
		protocol = "";
	}
	// 无协议时，根据类型自动补全默认协议
	else {
		protocol = input.isEmail
			? "mailto:"    // 邮箱地址补全mailto协议
			: input.isFile
			? "file:///"   // 文件路径补全file协议
			: "http://";   // 普通URL默认补全http协议
	}

	// 4. 文本截断处理
	// 对过长的链接进行截断，优化显示效果
	if (options && options.truncate) {
		// 获取用户配置的截断长度（支持动态计算）
		truncation = applyOption(input.string, input, options.truncate);
	}
	// 处理是否从中间截断（默认从末尾截断）
	if (options && options.middleTruncation) {
		truncateFromTheMiddle = applyOption(
			input.string,
			input,
			options.middleTruncation
		);
	}

	// 5. 自定义属性处理
	// 为<a>标签添加额外属性（如class、target、rel等）
	if (options && options.attributes) {
		attributes = applyOption(input.string, input, options.attributes);
	}

	// 6. 生成最终的<a>标签字符串
	return `<a 
		${Object.keys(attributes)
			.map((key) =>
				// 处理属性值：若为true则只显示属性名（如disabled），否则显示key="value"
				attributes[key] === true ? key : `${key}="${attributes[key]}" `
			)
			.join(" ")}
		href="${protocol}${input.string}"  // 拼接协议和原始字符串作为href
	>
		${
			// 处理文本显示：根据截断规则显示完整或截断的文本
			input.string.length > truncation
				? truncateFromTheMiddle
					// 中间截断：保留前半部分+省略号+后半部分
					: input.string.substring(0, Math.floor(truncation / 2)) +
					  "…" +
					  input.string.substring(
						  input.string.length - Math.ceil(truncation / 2),
						  input.string.length
					  )
					// 末尾截断：保留前truncation位+省略号
					: input.string.substring(0, truncation) + "…"
				: input.string  // 长度未超过阈值，显示完整字符串
		}
	</a>`;
}
```

## 扩展
扩展功能，核心是帮开发者**用统一接口处理 @提及、# 话题、代码块等非标准文本**，无需单独写正则匹配和 HTML 转换逻辑，尤其适合社交媒体、聊天应用等场景。



Anchorme 中的扩展是一个包含两个属性的简单对象：

```typescript
{
  test: RegExp,    // 用于匹配模式的正则表达式
  transform: Function  // 将匹配项转换为 HTML 的函数
}
```

`test` 属性是一个正则表达式，用于标识想要匹配的模式。`transform` 函数接收匹配的字符串，并返回想要替换成的 HTML。



Anchorme 遵循「**先扩展、后核心**」的顺序处理文本，避免自定义逻辑干扰 URL / 邮箱检测。

会先按顺序遍历所有扩展，用每个扩展的 “匹配规则” 找到文本中的目标内容，再用 “转换规则” 替换为 HTML，最终更新输入文本。

```typescript
if (extensions) {
  for (let index = 0; index < extensions.length; index++) {
    const extension = extensions[index];
    // 核心操作：用扩展处理文本
    input = input.replace(extension.test, extension.transform);
  }
}
```

扩展的处理是 “**链式更新”** 的 —— 每个扩展都基于前一个扩展处理后的文本继续执行，确保多扩展协同工作。

### 注意事项
`extension.test`（匹配规则）必须带 `g` 全局标识（如 `/@(\w+)/gi`），否则`replace`只会处理**第一个匹配项**，后续相同内容不会被转换。

+ 错误示例：`test: /@(\w+)/i`（无`g`）→ 文本中多个 @提及仅第一个被转换；
+ 正确示例：`test: /@(\w+)/gi`（有`g`）→ 所有 @提及都会被处理。

### 示例
以下构建一个全面的示例，为社交媒体平台增强文本：

```typescript
const socialText = `
  嘿 @sarah！看看这篇关于 #javascript 的 #awesome 文章。
  访问 https://example.com 或发邮件给我 john@example.com。
  \`代码片段：const x = 10;\`
`;
 
anchorme({
  input: socialText,
  extensions: [
    // 提及
    {
      test: /@(\w|_)+/gi,
      transform: string => {
        const username = string.substring(1);
        return `<a href="/profile/${username}" class="mention">${string}</a>`;
      }
    },
    // 标签
    {
      test: /#(\w|_)+/gi,
      transform: string => {
        const tag = string.substring(1);
        return `<a href="/tags/${tag}" class="hashtag">${string}</a>`;
      }
    },
    // 行内代码
    {
      test: /`([^`]+)`/g,
      transform: match => {
        const code = match.substring(1, match.length - 1);
        return `<code class="inline-code">${code}</code>`;
      }
    }
  ]
});
```

## 性能优化

anchorme.js 的高性能源于三层核心设计，从底层减少计算与内存开销：

1. **单条优化正则表达式：** 用 1 条正则覆盖 99% 的 URL / 邮箱 / 文件路径检测，避免多轮正则匹配的 overhead；还会自动尝试 “后向断言”（Lookbehind）进一步提速（不支持则降级）。
2. **增量字符串处理：** 非递归构建结果，逐段拼接文本（而非创建大量中间字符串），减少垃圾回收压力。
3. **预计算索引映射：** 提前定义 URL 各部分（如协议、主机、端口）的索引位置，无需多次解析或字符串分割。

### 单条优化正则表达式
这种方法最小化了多次正则表达式传递和字符串操作的开销。该正则表达式经过精心设计，可在单次文本遍历中匹配URL、电子邮件和文件路径。

```typescript
// 核心正则表达式将多个模式组合为一个高效表达式
export const finalRegex = new RegExp(final2, "gi");
// 如果支持，尝试使用后向断言以获得更好的性能
try {
  finalRegex = new RegExp(final1, "gi");
} catch (e) {
  finalRegex = new RegExp(final2, "gi");
}
```

### 高效的字符串处理
```typescript
// 遍历匹配项数组（found：存储检测到的URL/邮箱等，每项含start/end索引标记在原始文本中的位置）
// 核心优化：通过"逐段增量拼接"替代传统频繁+=，减少临时字符串生成，降低内存占用与GC压力
for (let index = 0; index < found.length; index++) {
    newStr =
        // 处理【当前匹配项之前的原始文本】：
        // 1. 若newStr已存在（非首轮循环）：直接复用已拼接结果，避免重复截取
        // 2. 若为首轮循环（index===0）：截取原始文本开头到当前匹配项start的片段
        // 3. 非首轮且newStr为空（异常场景）：补空串，避免拼接错误
        (newStr
            ? newStr
            : index === 0
            ? input.substring(0, found[index].start)
            : "") +
        // 处理【当前匹配项】：将匹配到的内容（如URL）转为链接等目标格式
        transform(found[index], options) +
        // 处理【当前匹配项之后的原始文本】：
        // 1. 若有下一个匹配项：截取当前end到下一个start的片段
        // 2. 若无下一个匹配项：截取当前end到原始文本末尾，避免越界与无效操作
        (found[index + 1]
            ? input.substring(found[index].end, found[index + 1].start)
            : input.substring(found[index].end));
}
```

这段代码是 Anchorme.js 中**高效字符串拼接**的核心逻辑。其优化目标是解决传统字符串处理的 “内存冗余” 和 “性能损耗” 问题，以下从优化效果和原理两方面拆解：

#### 优化效果
1. **少生成临时字符串**：避免传统 `+=` 拼接时频繁创建中间字符串，减少内存占用；
2. **降低 GC 压力**：临时对象少，浏览器不用频繁回收垃圾，避免主线程卡顿时；
3. **长文本更稳**：处理大文本（如长文档）时，性能不会像传统写法那样明显衰减。

#### 优化原理
主循环在单次传递中通过 “**增量构建 + 精准索引截取 + 无冗余判断**” 实现高效拼接，基于 “匹配项数组 `found`”（每个项含 `start`/`end` 索引，标记链接在原始文本 `input` 中的位置），按 “逐段拼接” 思路实现：

1. **增量构建结果**不一次性处理整个文本，每轮循环只拼 “当前匹配项 + 前后必要原始片段”，用 `newStr` 逐步积累最终结果，避免一次性操作大文本。
2. **精准判断边界**
    - 若为第一个匹配项：先拼 “`input` 开头到匹配项 `start`” 的片段；后续匹配项直接复用已拼好的 `newStr`；
    - 若有下一个匹配项：拼 “当前匹配项 `end` 到下一个 `start`”；若无，拼 “当前 `end` 到 `input` 末尾”，避免无效截取。
3. **无递归、无额外数据结构**
    - 用 **for 循环（非递归）** 处理：避免递归调用的栈开销，同时更易控制 “每轮处理范围”（递归处理长文本可能触发栈溢出，且难以调试）。
    - 直接基于原始文本索引操作：无需先将文本 `split` 成数组（`split` 会生成额外数组和临时字符串），直接通过 `input.substring(start, end)` 精准截取片段，减少中间数据结构的内存占用。

### 预计算的索引映射
在库初始化阶段（而非运行时），提前定义好 “URL / 邮箱 / 文件路径的类型标记” 和 “各组成部分” 与「正则捕获组索引」的对应关系。

```typescript
// 用于快速URL部分识别的预计算索引
const iidxes = {
  "isFile": 8,          // 标记“是否为文件路径”的捕获组索引
  "file": {             // 文件路径的各组成部分对应的捕获组索引
    "fileName": 10, 
    "protocol": 9
  },
  "isEmail": 2,         // 标记“是否为邮箱”的捕获组索引
  "email": {            // 邮箱的各组成部分对应的捕获组索引
    "protocol": 3,      // 如“mailto:”
    "local": 4,         // 邮箱@前的部分（如“user”）
    "host": 5           // 邮箱@后的域名（如“example.com”）
  },
  "isURL": 11,          // 标记“是否为URL”的捕获组索引
  "url": {              // URL的各组成部分对应的捕获组索引
    "TLD": [18, 6],     // 顶级域名（如“.com”）
    "protocol": [15, 22],// 协议（如“https:”）
    "host": [17],       // 主机名（如“www.google.com”）
    "ipv4": 19,         // IPv4地址（如“192.168.1.1”）
    "port": 21,         // 端口号（如“:8080”）
    "path": 24          // 路径（如“/search”）
  }
};
```

它有以下作用：

1. **配合单正则，实现 “一次匹配即解析”**：核心正则完成 “一次遍历检测” 后，通过预定义索引直接从匹配结果中提取 URL 协议、邮箱用户名等关键信息，无需二次正则或字符串处理；
2. **消除冗余计算**：避免传统方案的 “多次正则捕获”“字符串拆分（如`split`）”，减少文本遍历次数，降低时间开销；
3. **快速类型判断**：通过`isURL`/`isEmail`/`isFile`对应的索引（如`isURL:11`），检查匹配结果中对应捕获组是否有值，快速判断内容类型，无需冗余逻辑；
4. **降低内存与 GC 压力**：无需生成临时数组（如拆分后的字符串数组），仅通过一次正则的`match`结果按索引取值，减少内存分配和垃圾回收波动。



它本质是一种 “**空间换时间**” 的优化策略 —— 通过在库初始化时预定义 “捕获组索引与内容类型的映射关系”，彻底消除运行时的冗余计算（多次正则、字符串拆分），实现 “一次匹配即完成检测 + 解析”。
