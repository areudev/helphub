import { Badge } from '#app/components/ui/badge'
import { Button } from '#app/components/ui/button'
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from '#app/components/ui/command'
import { Icon } from '#app/components/ui/icon'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '#app/components/ui/popover'
import { Separator } from '#app/components/ui/separator'
import { cn } from '#app/utils/misc'

export function CategoryFilter({
	categories,
	selectedCategories,
	setSelectedCategories,
}: {
	categories: { id: string; name: string }[]
	selectedCategories: string[]
	setSelectedCategories: (categories: string[]) => void
}) {
	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant="outline" size="sm" className="h-10 border-dashed">
					<Icon name="plus" className="mr-2 h-4 w-4" />
					Categories
					{selectedCategories.length > 0 && (
						<>
							<Separator orientation="vertical" className="mx-2 h-4" />
							<Badge
								variant="default"
								className="rounded-sm px-1 font-normal lg:hidden"
							>
								{selectedCategories.length}
							</Badge>
							<div className="hidden space-x-1 lg:flex">
								{selectedCategories.length > 2 ? (
									<Badge
										variant="default"
										className="rounded-sm px-1 font-normal"
									>
										{selectedCategories.length} selected
									</Badge>
								) : (
									categories
										.filter((category) =>
											selectedCategories.includes(category.id),
										)
										.map((category) => (
											<Badge
												variant="default"
												key={category.id}
												className="rounded-sm px-1 font-normal"
											>
												{category.name}
											</Badge>
										))
								)}
							</div>
						</>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[200px] p-0" align="start">
				<Command>
					<CommandInput placeholder="Search categories..." />
					<CommandList>
						<CommandEmpty>No results found.</CommandEmpty>
						<CommandGroup>
							{categories.map((category) => {
								const isSelected = selectedCategories.includes(category.id)
								return (
									<CommandItem
										key={category.id}
										onSelect={() => {
											if (isSelected) {
												setSelectedCategories(
													selectedCategories.filter((id) => id !== category.id),
												)
											} else {
												setSelectedCategories([
													...selectedCategories,
													category.id,
												])
											}
										}}
									>
										<div
											className={cn(
												'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
												isSelected
													? 'bg-primary text-primary-foreground'
													: 'opacity-50 [&_svg]:invisible',
											)}
										>
											<Icon name="check" className={cn('h-4 w-4')} />
										</div>
										<span>{category.name}</span>
									</CommandItem>
								)
							})}
						</CommandGroup>
						{selectedCategories.length > 0 && (
							<>
								<CommandSeparator />
								<CommandGroup>
									<CommandItem
										onSelect={() => setSelectedCategories([])}
										className="justify-center text-center"
									>
										Clear filters
									</CommandItem>
								</CommandGroup>
							</>
						)}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	)
}
