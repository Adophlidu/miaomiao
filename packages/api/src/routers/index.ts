import { protectedProcedure, publicProcedure, router } from "../index";
import { categoryRouter } from "./category";
import { todoRouter } from "./todo";
import { transactionRouter } from "./transaction";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),
  todo: todoRouter,
  category: categoryRouter,
  transaction: transactionRouter,
});
export type AppRouter = typeof appRouter;
