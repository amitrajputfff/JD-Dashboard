import { LoginForm } from "@/components/login-form"
import { TestimonialCardStack } from "@/components/testimonial-card-stack"
import { testimonials } from "@/lib/testimonials"
import { AuthPageGuard } from "@/components/auth-guard"
import { BackgroundGradientAnimation } from "@/components/ui/background-gradient-animation"
import Image from "next/image"

export default function LoginPage() {
  return (
    <AuthPageGuard>
      <div className="grid min-h-svh lg:grid-cols-2">
        <div className="flex flex-col gap-3 p-6 md:p-10">
          <div className="flex justify-center gap-2 md:justify-start">
            <a href="#" className="flex items-center gap-2">
              <Image
                src="/LiaPlus-Ai-Logo-1.svg"
                alt="LiaPlus AI"
                width={120}
                height={32}
                className="h-8 w-auto"
              />
            </a>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-sm">
              <LoginForm />
            </div>
          </div>
        </div>
        <div className="relative hidden lg:block overflow-hidden">
          <BackgroundGradientAnimation
            gradientBackgroundStart="rgb(0, 0, 0)"
            gradientBackgroundEnd="rgb(15, 10, 40)"
            firstColor="59, 130, 246"
            secondColor="168, 85, 247"
            thirdColor="250, 204, 21"
            fourthColor="37, 99, 235"
            fifthColor="192, 132, 252"
            pointerColor="234, 179, 8"
            size="90%"
            blendingValue="overlay"
            containerClassName="h-full w-full"
            interactive={true}
          >
            <div className="absolute z-50 inset-0 flex items-center justify-center pointer-events-none">
              <div className="pointer-events-auto">
                <TestimonialCardStack items={testimonials} />
              </div>
            </div>
          </BackgroundGradientAnimation>
        </div>
      </div>
    </AuthPageGuard>
  )
}
