export default function BrandCredit({ className = '' }: { className?: string }) {
  return (
    <p className={`text-xs text-muted/60 ${className}`.trim()}>
      <a
        href="https://karmakode.co"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-muted transition-colors"
      >
        PutMeOn by KarmaKode
      </a>
    </p>
  )
}
