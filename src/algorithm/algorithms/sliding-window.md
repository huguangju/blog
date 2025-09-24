---
title: 滑动窗口算法及应用
date: 2023-04-08
category:
  - 算法
---

## 算法简介

滑动窗口算法（Sliding Window Algorithm）是一种常见的算法，用于解决数组或字符串的子问题。它通过维护一个大小可变的窗口，对数据进行处理。这个窗口的左右两端方向一致的向前滑动（右端固定，左端滑动；左端固定，右端滑动）。在处理数据时，窗口会向右移动，直到处理完整个数据集。

该算法常用于求解子数组或子字符串的问题，例如最大子数组和、最小子数组和、最长连续递增子序列等等。其时间复杂度通常为O(n)，是一种高效的算法。

<!-- more -->

## [滑动窗口的平均值](https://leetcode.cn/problems/qIsx9U/description/)

给定一个整数数据流和一个窗口大小，根据该滑动窗口的大小，计算滑动窗口里所有数字的平均值。

实现 MovingAverage 类：

- `MovingAverage(size: number)` 用窗口大小 `size` 初始化对象。
- `next(val: number): number` 成员函数 `next` 每次调用的时候都会往滑动窗口增加一个整数，请计算并返回数据流中最后 size 个值的移动平均值，即滑动窗口里所有数字的平均值。

### 思路

- 使用一个队列来存储滑动窗口中的元素，使用一个变量来记录滑动窗口中所有元素的和。
- 每次调用 `next` 方法时，将新的元素加入队列中，并更新滑动窗口中所有元素的和。
- 如果队列的长度超过了滑动窗口的大小，需要将队首元素弹出，并从滑动窗口中减去该元素的值。
- 最后，返回滑动窗口中所有元素的平均值。

### 实现

```javascript
class MovingAverage {
  // 初始化队列、队列长度和当前和
  constructor(size) {
    this.size = size;
    this.queue = [];
    this.sum = 0;
  }

  next(val) {
    // 如果队列长度等于规定长度，则弹出队列头部元素，同时减去该元素的值
    if (this.queue.length === this.size) {
      this.sum -= this.queue.shift();
    }
    // 将新的元素加入队列尾部，并加上该元素的值
    this.queue.push(val);
    this.sum += val;
    // 返回队列中所有元素的平均值
    return this.sum / this.queue.length;
  }
}
```

示例：

```js
const movingAverage = new MovingAverage(3); // 声明了窗口的长度为 3
movingAverage.next(1); // 返回 1.0 = 1 / 1
movingAverage.next(10); // 返回 5.5 = (1 + 10) / 2
movingAverage.next(3); // 返回 4.66667 = (1 + 10 + 3) / 3
movingAverage.next(5); // 返回 6.0 = (10 + 3 + 5) / 3
```

## [最长重复子数组](https://leetcode.cn/problems/maximum-length-of-repeated-subarray/)

给两个整数数组 `nums1` 和 `nums2` ，返回 `两个数组中公共的 、长度最长的子数组的长度`。

### 思路

- 枚举 nums1 和 nums2 所有的对齐方式。
- 第一类为 A 不变，B 的首元素与 A 中的某个元素对齐；
- 第二类为 B 不变，A 的首元素与 B 中的某个元素对齐。
- 对于每一种对齐方式，计算它们相对位置相同的重复子数组即可。

### 实现

```javascript
// 查找两个数组中的最长重复子数组
function findLength(nums1, nums2) {
  let len1 = nums1.length;
  let len2 = nums2.length;
  let maxLength = 0;
  // 遍历 nums1，计算以该位置开始的最长重复子数组的长度
  for (let i = 0; i < len1; i++) {
    let len = Math.min(len2, len1 - i);
    let currentLength = this.getMaxLength(nums1, nums2, i, 0, len);
    maxLength = Math.max(maxLength, currentLength);
  }
  // 遍历 nums2，计算以该位置开始的最长重复子数组的长度
  for (let i = 0; i < len2; i++) {
    let len = Math.min(len1, len2 - i);
    let currentLength = this.getMaxLength(nums1, nums2, 0, i, len);
    maxLength = Math.max(maxLength, currentLength);
  }
  return maxLength;
}

// 计算以 add1 和 add2 为起点，长度为 len 的最长重复子数组的长度
function getMaxLength(nums1, nums2, add1, add2, len) {
  let maxLength = 0;
  let currentLength = 0;
  for (let i = 0; i < len; i++) {
    // 如果 nums1 和 nums2 数组中当前位置的元素相等，则更新 currentLength 和 maxLength 的值
    if (nums1[add1 + i] == nums2[add2 + i]) {
      currentLength++;
    } else {
      currentLength = 0;
    }
    maxLength = Math.max(maxLength, currentLength);
  }
  return maxLength;
}
```

## [无重复字符的最长子串](https://leetcode.cn/problems/longest-substring-without-repeating-characters/)

给定一个字符串 `s` ，找出其中不含有重复字符的 **最长子串** 的长度。

### 思路

- 使用**两个指针**表示字符串中的某个子串（或窗口）的**左右边界**，其中左指针代表着上文中「枚举子串的起始位置」，而右指针为右边界；

- 在每一步的操作中，将左指针向右移动一格，表示 **开始枚举下一个字符作为起始位置**，然后可以不断地向右移动右指针，但需要保证这两个指针对应的子串中没有重复的字符。在移动结束后，这个子串就对应着 **以左指针开始的，不包含重复字符的最长子串**。记录下这个子串的长度；

- 枚举结束后，找到的最长的子串的长度即为答案

### 实现

```javascript
function lengthOfLongestSubstring (s) {
  const occ = new Set();
  const n = s.length;
  // 右指针，初始值为 -1，相当于我们在字符串的左边界的左侧，还没有开始移动
  let rk = -1, ans = 0;
  for (let i = 0; i < n; ++i) {
    if (i != 0) {
      // 左指针向右移动一格，移除一个字符
      occ.delete(s.charAt(i - 1));
    }
    // 右指针 rk 没有到达字符串末尾并，且当前字符 s.charAt(rk + 1) 没有出现过
    while (rk + 1 < n && !occ.has(s.charAt(rk + 1))) {
      // 不断地移动右指针
      occ.add(s.charAt(rk + 1));
      ++rk;
    }
    // 第 i 到 rk 个字符是一个极长的无重复字符子串
    ans = Math.max(ans, rk - i + 1);
  }
  return ans;
};
```

:::warning 为什么用 chartAt 而不用数组下标方式获取字符呢？
`s.charAt(i - 1)` 和 `s[i - 1]` 都可以用来获取字符串 `s` 中下标为 `i - 1` 的字符，它们的作用是相同的。但是，它们在实现上是有一些区别。

- `s.charAt(i - 1)`：`charAt` 是字符串对象的一个方法，用来获取字符串中指定位置的字符。如果 **指定位置超出了字符串的范围，返回空字符串**；

- `s[i - 1]`：如果指定位置超出了字符串的范围，会抛出一个异常

在这个算法中，如果确定输入的字符串是合法的，那么使用 `s[i - 1]` 也是可以的，而且可能会稍微快一些。但是，为了保证代码的健壮性，建议使用 `charAt` 方法。
:::

## 参考

- [滑动窗口详解 - 力扣](https://leetcode.cn/circle/article/9gcJBk/)
- [无重复字符的最长子串 - 解题思路](https://leetcode.cn/problems/longest-substring-without-repeating-characters/solutions/227999/wu-zhong-fu-zi-fu-de-zui-chang-zi-chuan-by-leetc-2/?languageTags=javascript)
