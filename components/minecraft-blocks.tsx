export function MinecraftBlocks() {
  return (
    <div className="fixed left-4 top-24 pointer-events-none hidden lg:block">
      {/* Decorative Minecraft blocks */}
      <div className="space-y-2">
        {/* Block row 1 */}
        <div className="flex gap-2">
          <div className="h-8 w-8 rounded border-2 border-primary/40 bg-primary/10 backdrop-blur-sm"></div>
          <div className="h-8 w-8 rounded border-2 border-primary/30 bg-primary/5"></div>
        </div>
        {/* Block row 2 */}
        <div className="flex gap-2 ml-4">
          <div className="h-8 w-8 rounded border-2 border-primary/35 bg-primary/8"></div>
          <div className="h-8 w-8 rounded border-2 border-primary/25 bg-primary/5"></div>
          <div className="h-8 w-8 rounded border-2 border-primary/30 bg-primary/10"></div>
        </div>
        {/* Block row 3 */}
        <div className="flex gap-2">
          <div className="h-8 w-8 rounded border-2 border-primary/40 bg-primary/10"></div>
          <div className="h-8 w-8 rounded border-2 border-primary/35 bg-primary/8"></div>
        </div>
      </div>
    </div>
  )
}
