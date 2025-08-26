/**
 * 基础图片配置，包含所有图片的默认值
 */
const baseImageConfig = {
	quality: "max" as const, // https://docs.astro.build/zh-cn/reference/modules/astro-assets/#quality
};

/**
 * 配置: 适用于 Markdown 中的图片
 * @description 容器布局复杂，在不同断点下有多次流体变化
 */
export const markdownImageConfig = {
	...baseImageConfig,
	sizes:
		"(max-width: 767px) calc(100vw - 42px), (max-width: 1023px) calc(100vw - 104px), (max-width: 1199px) calc(100vw - 400px), 800px",
};

/**
 * 配置: 适用于侧边栏中的头像图片
 * @description 最大显示尺寸为 256px，针对 1x, 2x 屏幕优化
 */
export const avatarImageConfig = {
	...baseImageConfig,
	widths: [168, 192, 256, 384, 512],
	sizes: "(max-width: 767px) 168px, (max-width: 1023px) 192px, 256px",
};

/**
 * 配置: 适用于横跨页面的 Banner 横幅图片
 * @description 总是占据 100% 的视口宽度
 */
export const bannerImageConfig = {
	...baseImageConfig,
	widths: [480, 828, 1280, 1668, 1920, 2388], // 需根据banner图像尺寸调整
	sizes: "100vw",
};

/**
 * 配置: 适用于 PostCard 的封面图片
 * @description 根据开发者工具测量得出，反映所有 CSS 规则、变量和潜在 JS 动态调整后的最终结果
 */
export const coverImageConfig = {
	...baseImageConfig,
	widths: [244, 488, 732],
	sizes:
		"(max-width: 767px) calc(100vw - 28px), (max-width: 1023px) calc(28vw - 9px), (max-width: 1199px) calc(28vw - 92px), 244px",
};
