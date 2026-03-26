import Image from 'next/image'
import { InfiniteSlider } from '@/components/ui/infinite-slider'

export const LogoCloud = () => {
    return (
        <div className="w-full overflow-hidden py-4">
            <div className="relative w-full">
                <InfiniteSlider
                    speed={50}
                    speedOnHover={20}
                    gap={60}>
                    <Image
                        className="h-10 w-auto "
                        src="/Investor-1.png"
                        alt="Investor 1"
                        height={40}
                        width={200}
                        unoptimized
                    />
                    <Image
                        className="h-10 w-auto "
                        src="/Investor-2.png"
                        alt="Investor 2"
                        height={40}
                        width={200}
                        unoptimized
                    />
                    <Image
                        className="h-10 w-auto "
                        src="/Investor-3.png"
                        alt="FirstRand Bank"
                        height={40}
                        width={200}
                        unoptimized
                    />
                    <Image
                        className="h-10 w-auto  invert"
                        src="/Investor-4.png"
                        alt="Investor 4"
                        height={40}
                        width={200}
                        unoptimized
                    />
                    <Image
                        className="h-10 w-auto  invert"
                        src="/Investor-6.png"
                        alt="Infogain"
                        height={40}
                        width={200}
                        unoptimized
                    />
                    <Image
                        className="h-10 w-auto  invert"
                        src="/Investor-7.webp"
                        alt="MeitY Startup Hub"
                        height={40}
                        width={200}
                        unoptimized
                    />
                    <Image
                        className="h-10 w-auto invert"
                        src="/Investor-8.png"
                        alt="Metalbook"
                        height={40}
                        width={200}
                        unoptimized
                    />
                    <Image
                        className="h-10 w-auto invert"
                        src="/Investor-9.png"
                        alt="Ministry of Electronics and Information Technology"
                        height={40}
                        width={300}
                        unoptimized
                    />
                    <Image
                        className="h-10 w-auto invert"
                        src="/Investor-10.png"
                        alt="Monte Carlo"
                        height={40}
                        width={250}
                        unoptimized
                    />
                    <Image
                        className="h-10 w-auto invert"
                        src="/Investor-11.png"
                        alt="Investor 11"
                        height={40}
                        width={200}
                        unoptimized
                    />
                    <Image
                        className="h-10 w-auto invert"
                        src="/Investor-12.png"
                        alt="Investor 12"
                        height={40}
                        width={200}
                        unoptimized
                    />
                </InfiniteSlider>

                <div className="pointer-events-none absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-transparent via-transparent to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-transparent via-transparent to-transparent" />
            </div>
        </div>
    )
}
