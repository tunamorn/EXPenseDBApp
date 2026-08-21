export type Expense = {
  id: number; // ตรงกับคอลัมน์ id (bigint identity) ในตาราง expenses
  expense_date: string; // YYYY-MM-DD
  category: string;
  amount: number;
  note: string; // ในฐานข้อมูลปล่อยว่างได้ (null) แต่ในแอปใช้ "" แทน
};
