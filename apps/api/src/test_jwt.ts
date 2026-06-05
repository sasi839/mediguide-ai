import jwt from 'jsonwebtoken';

const token = jwt.sign({ userId: '123' }, 'fallback', { expiresIn: '7d' });
console.log("Signed with fallback:", token);

try {
  const decoded = jwt.verify(token, 'fallback');
  console.log("Verified successfully:", decoded);
} catch (e: any) {
  console.log("Failed to verify:", e.message);
}
