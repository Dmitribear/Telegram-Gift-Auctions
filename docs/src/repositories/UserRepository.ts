import { ClientSession, Types } from "mongoose";
import { IUser, User } from "../models/User";

export class UserRepository {
  static create(
    data: Pick<IUser, "username"> & Partial<Pick<IUser, "balance">>,
    session?: ClientSession
  ) {
    const user = new User({
      username: data.username,
      balance: data.balance ?? 0,
    });
    return user.save({ session });
  }

  static findById(id: string | Types.ObjectId, session?: ClientSession) {
    return User.findById(id).session(session ?? null);
  }

  static incrementBalance(
    userId: string | Types.ObjectId,
    amount: number,
    session?: ClientSession
  ) {
    return User.findByIdAndUpdate(
      userId,
      { $inc: { balance: amount } },
      { new: true, session }
    );
  }
}
