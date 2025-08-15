import Image from "next/image";

export function Navbar() {
	return (
		<nav className="h-[72px] px-4 w-full mb-6 box-border overflow-hidden md:h-[72px] md:px-4 md:mb-6 sm:h-[60px] sm:px-4 sm:py-3 sm:mb-10 xs:h-14 xs:px-3 xs:py-2 xs:mb-8 flex items-center">
			<div className="max-w-[1240px] w-full mx-auto flex justify-between items-center box-border px-4 md:px-4 sm:max-w-full sm:px-4 xs:px-3">
				<a 
					target="_blank" 
					rel="opener noferrer" 
					href="https://prisma.io"
				>
					<Image src="/logo-dark.svg" alt="Prisma logo" width={100} height={100} />
				</a>
				<div className="flex gap-8 md:gap-8 sm:gap-4">
					<a 
						target="_blank" 
						rel="opener noferrer" 
						href="http://github.com/prisma"
						className="sm:inline-flex hidden"
					>
						<Image src="/github.svg" alt="github" width="31" height="31"/>
					</a>
					<div className="flex gap-4 md:gap-4 sm:flex-row sm:gap-3">
						<a 
							className="sm:inline-flex hidden justify-center max-w-full text-left z-10 w-max items-center box-border rounded-md no-underline relative bg-transparent text-[#16A394] font-barlow py-[5px] px-3 text-base font-bold leading-5 border-2 border-[#16A394] transition-all duration-150 ease-in-out hover:border-[#154f47] hover:bg-transparent hover:text-[#154f47] focus-within:after:content-[''] focus-within:after:absolute focus-within:after:rounded-[9px] focus-within:after:box-content focus-within:after:border-2 focus-within:after:border-[#154f47] focus-within:after:top-[-6px] focus-within:after:w-[calc(100%+8px)] focus-within:after:h-[calc(100%+8px)] focus-within:after:left-[-6px] md:text-base md:py-[5px] md:px-3 sm:text-sm sm:py-1.5 sm:px-3 sm:min-h-[36px] xs:text-[13px] xs:py-[5px] xs:px-2.5 xs:min-h-8 touch-manipulation:min-h-11 touch-manipulation:py-2 touch-manipulation:px-4" 
							href="https://console.prisma.io/login?utm_campaign=create_db&utm_source=create_db_web" 
							target="_blank" 
							rel="opener noferrer"
						>
							Login
						</a>
						<a 
							className="inline-flex justify-center max-w-full text-left z-10 w-max items-center box-border rounded-md no-underline relative bg-[#16A394] text-white font-barlow py-[5px] px-3 text-base font-bold leading-5 border-2 border-[#16A394] transition-all duration-150 ease-in-out hover:bg-[#154f47] focus-within:after:content-[''] focus-within:after:absolute focus-within:after:rounded-[9px] focus-within:after:box-content focus-within:after:border-2 focus-within:after:border-white focus-within:after:top-[-4px] focus-within:after:w-[calc(100%+6px)] focus-within:after:h-[calc(100%+6px)] focus-within:after:left-[-4px] md:text-base md:py-[5px] md:px-3 sm:text-sm sm:py-1.5 sm:px-3 sm:min-h-[36px] xs:text-[13px] xs:py-[5px] xs:px-2.5 xs:min-h-8 touch-manipulation:min-h-11 touch-manipulation:py-2 touch-manipulation:px-4" 
							href="https://console.prisma.io/sign-up?utm_campaign=create_db&utm_source=create_db_web" 
							target="_blank" 
							rel="opner noferrer"
						>
							Sign up
						</a>
					</div>
				</div>
			</div>
		</nav>
	);
}
