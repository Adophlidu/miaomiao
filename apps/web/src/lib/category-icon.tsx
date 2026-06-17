import {
  Bus,
  Clapperboard,
  Coffee,
  Gift,
  Heart,
  Home,
  PawPrint,
  PiggyBank,
  ShoppingBag,
  type LucideIcon,
  Utensils,
  Wallet,
} from "lucide-react";

/**
 * Map a category name (Chinese, from the seeded defaults or user input) to a
 * lucide icon. Falls back to a paw print so every category gets a cat-friendly glyph.
 */
const RULES: Array<[RegExp, LucideIcon]> = [
  [/餐|饮|吃|食/, Utensils],
  [/咖啡|奶茶|饮品/, Coffee],
  [/交通|车|出行|通勤/, Bus],
  [/购物|买|商场/, ShoppingBag],
  [/居住|房|家|租/, Home],
  [/娱乐|影|游戏|玩/, Clapperboard],
  [/宠物|猫|狗/, PawPrint],
  [/工资|薪|奖金/, Wallet],
  [/收入|理财|投资/, PiggyBank],
  [/红包|礼|赠/, Gift],
  [/医|健康|运动/, Heart],
];

export function categoryIcon(name: string): LucideIcon {
  for (const [re, icon] of RULES) {
    if (re.test(name)) return icon;
  }
  return PawPrint;
}
