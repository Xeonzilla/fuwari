import path from "node:path";
import { visit } from "unist-util-visit";

const isRelativePath = (url) => !/^\/|^(?:[a-z]+:)?\/\//i.test(url);

export function remarkImageComponent() {
	return (tree, file) => {
		visit(tree, "image", (node) => {
			const imageUrl = node.url;
			let finalSrc = imageUrl;

			if (isRelativePath(imageUrl)) {
				const fileDir = file.dirname;
				const srcDir = path.join(file.cwd, "src");
				const contentDir = path.relative(srcDir, fileDir);
				finalSrc = path.join(contentDir, imageUrl).replace(/\\/g, "/");
			}

			node.type = "mdxJsxFlowElement";
			node.name = "ImageWrapper";
			node.attributes = [
				{ type: "mdxJsxAttribute", name: "src", value: finalSrc },
				{ type: "mdxJsxAttribute", name: "alt", value: node.alt },
			];

			delete node.url;
			delete node.alt;
			delete node.title;
		});
	};
}
