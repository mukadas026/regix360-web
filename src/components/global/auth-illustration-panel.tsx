import Image from "next/image";

export function AuthIllustrationPanel() {
  return (
    <div className="relative hidden flex-1 lg:flex">
      <Image src="/login-splash.png" alt="" fill priority className="object-cover" />
      <div className="absolute inset-x-0 top-10 flex justify-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-white shadow-lg">
          <Image src="/logo-icon.png" alt="" width={44} height={44} />
        </div>
      </div>
    </div>
  );
}
