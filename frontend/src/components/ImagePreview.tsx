import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface Props {
  imagePath: string
  onRemove: () => void
}

export default function ImagePreview({ imagePath, onRemove }: Props) {
  return (
    <Card className="rounded-2xl overflow-hidden border-slate-200">
      <div className="relative">
        <img
          src={imagePath}
          alt="题目截图"
          className="w-full h-auto max-h-48 object-contain bg-slate-100"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="absolute top-2 right-2 rounded-full bg-white/80 hover:bg-white shadow-sm h-7 w-7"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </Card>
  )
}
