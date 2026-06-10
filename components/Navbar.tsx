import Link from "next/link";

export default function Navbar() {
  return (
    <nav id="navbar">
      <Link href="/" className="nav-logo">
        VAJRA
      </Link>
      <ul className="nav-links">
        <li>
          <Link href="/">Home</Link>
        </li>
        <li>
          <Link href="/create-token">Create Token</Link>
        </li>
        <li>
          <a href="#">Features</a>
        </li>
        <li>
          <a href="#">Docs</a>
        </li>
        <li>
          <a href="#">Community</a>
        </li>
      </ul>
      <a href="#" className="nav-cta">
        Connect Wallet
      </a>
    </nav>
  );
}
