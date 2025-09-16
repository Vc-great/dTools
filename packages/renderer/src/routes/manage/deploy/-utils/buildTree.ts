import type { FindProjectResponseDto, ProjectResponseDto } from "@shared/types";

type Node = ProjectResponseDto & { label: string; children?: Node[] };

export function buildTree(nodes: FindProjectResponseDto): Node[] {
	const nodeMap = new Map<string, Node>();

	// 初始化map
	nodes.forEach((node) => {
		nodeMap.set(node.id, { ...node, label: node.name, children: [] });
	});

	const tree: Node[] = [];

	nodes.forEach((node) => {
		if (node.parentId) {
			const parent = nodeMap.get(node.parentId);
			if (parent) {
				parent.children?.push(nodeMap.get(node.id)!);
			}
		} else {
			tree.push(nodeMap.get(node.id)!);
		}
	});

	return tree;
}
