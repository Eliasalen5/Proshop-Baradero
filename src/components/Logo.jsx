export default function Logo({ className = '', size = 40 }) {
  return (
    <img
      src="/logo.png"
      alt="Proshop Baradero"
      width={size}
      height={size}
      className={`rounded object-cover ${className}`}
    />
  )
}
