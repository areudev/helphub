import { useField, useInputControl, type FieldName } from '@conform-to/react'
import { ErrorList } from '#app/components/forms.tsx'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	SelectGroup,
	SelectLabel,
	SelectScrollUpButton,
	SelectScrollDownButton,
} from '#app/components/ui/select'

type SelectFieldProps = {
	name: FieldName<string>
	options: Array<{ value: string; label: string }>
	label: string
	className?: string
}

export function SelectField({
	name,
	options,
	label,
	className,
}: SelectFieldProps) {
	const [meta] = useField(name)
	const control = useInputControl(meta)

	return (
		<div className={className}>
			<Select
				name={meta.name}
				value={control.value}
				onValueChange={(value) => {
					control.change(value)
				}}
				onOpenChange={(open) => {
					if (!open) {
						control.blur()
					}
				}}
			>
				<SelectTrigger>
					<SelectValue placeholder={label} />
				</SelectTrigger>
				<SelectContent>
					<SelectScrollUpButton />
					<SelectGroup>
						<SelectLabel>{label}</SelectLabel>
						{options.map((option) => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))}
					</SelectGroup>
					<SelectScrollDownButton />
				</SelectContent>
			</Select>
			<div className="min-h-[32px] px-4 pb-3 pt-1">
				<ErrorList errors={meta.errors} />
			</div>
		</div>
	)
}
