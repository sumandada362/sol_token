import fs from "fs";
import path from "path";
import matter from "gray-matter";

const CONTENT_ROOT = path.join(process.cwd(), "content");

export type FaqItem = { q: string; a: string };

export type ArticleFrontmatter = {
  title: string;
  description: string;
  slug: string;
  date: string;
  updated?: string;
  category: "guide" | "docs";
  tool?: string;
  readTime?: string;
  featured?: boolean;
  faq?: FaqItem[];
};

export type Article = {
  frontmatter: ArticleFrontmatter;
  content: string;
};

function contentDir(section: "blog" | "docs"): string {
  return path.join(CONTENT_ROOT, section);
}

export function getAllSlugs(section: "blog" | "docs"): string[] {
  const dir = contentDir(section);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""))
    .sort();
}

export function getArticle(section: "blog" | "docs", slug: string): Article | null {
  // Slug feeds a filesystem path — reject anything that isn't a plain slug
  if (!/^[a-z0-9-]+$/i.test(slug)) return null;
  const filePath = path.join(contentDir(section), `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  return { frontmatter: data as ArticleFrontmatter, content };
}

export function getAllArticles(section: "blog" | "docs"): Article[] {
  return getAllSlugs(section)
    .map((slug) => getArticle(section, slug))
    .filter((a): a is Article => a !== null)
    .sort((a, b) => (a.frontmatter.date < b.frontmatter.date ? 1 : -1));
}
