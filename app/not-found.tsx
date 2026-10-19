import Link from "next/link";

export default function NotFound() {
  return (
    <main className="login">
      <div className="login__card">
        <h1 className="login__title">Not found</h1>
        <p className="login__copy">That record does not exist, or it is not AI media.</p>
        <Link href="/" className="btn">Back to overview</Link>
      </div>
    </main>
  );
}
