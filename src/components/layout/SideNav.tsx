import { navLinks } from '@/data/layout'
import { sectionContent } from '@/data/home/sections'
import Button from '@/components/ui/buttons/Button'

interface SideNavProps {
    activeId: string
    onSelect: (id: string) => void
    className?: string
}

export default function SideNav({ activeId, onSelect, className = '' }: SideNavProps) {
    return (
        <div className={`glass rounded-sm flex flex-col items-center p-md gap-lg ${className}`}>
            <div>
                <h3 className="typo-h3 uppercase">
                    {sectionContent.hero.subtitle}
                </h3>
                <p className="typo-body-sm py-sm">{sectionContent.hero.description}</p>
            </div>


            <nav className="flex flex-col w-full">
                {navLinks.map(({ label, sectionId, description }) => {
                    const isActive = activeId === sectionId
                    return (
                        <div
                            key={sectionId}
                            className={`flex flex-col rounded-sm transition-all duration-300 ease-in-out ${isActive ? 'glass p-xs' : 'p-xs'}`}
                        >
                            <Button
                                label={label}
                                variant={isActive ? 'primary' : 'secondary'}
                                size="sm"
                                className="w-full"
                                onClick={() => onSelect(sectionId)}
                            />
                            {/* Expand/collapse animado via grid-rows 0fr→1fr (anima até altura automática) */}
                            <div
                                className={`grid transition-all duration-300 ease-in-out ${isActive ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                            >
                                <div className="overflow-hidden">
                                    <p className="typo-body-sm p-sm">{description}</p>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </nav>
        </div>
    )
}