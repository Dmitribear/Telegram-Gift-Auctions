import mongoose from 'mongoose';

// 1. Создаем интерфейс (для TypeScript) - аналог dataclass/pydantic
interface IUser {
  username: string;
  balance: number;
}

// 2. Создаем Схему (для MongoDB) - аналог SQLAlchemy Model
const UserSchema = new mongoose.Schema<IUser>({
  username: { type: String, required: true, unique: true },
  balance: { type: Number, default: 0 } // Mongoose не даст записать сюда текст
});

// 3. Экспортируем модель
export const User = mongoose.model<IUser>('User', UserSchema);