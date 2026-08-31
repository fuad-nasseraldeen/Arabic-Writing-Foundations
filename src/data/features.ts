import { BookOpen, Lightbulb, PencilLine, Shapes } from "lucide-react";
export const features = [
  { title: "אותיות בקבוצות", text: "חלוקת האותיות לקבוצות על פי מאפיינים חזותיים ומוטוריים משותפים.", href: "/letters", icon: Shapes, tone: "sage" },
  { title: "דפי עבודה", text: "דפי תרגול מדורגים להדפסה ולעבודה עם ילדים.", href: "/worksheets", icon: PencilLine, tone: "peach" },
  { title: "חומרי העשרה", text: "מאמרים, ידע וכלים להרחבת הידע המקצועי.", href: "/resources", icon: BookOpen, tone: "lavender" },
  { title: "טיפ השבוע", text: "טיפ קצר וישים שתוכלו ליישם בעבודה המקצועית.", href: "/weekly-tip", icon: Lightbulb, tone: "yellow" },
] as const;
