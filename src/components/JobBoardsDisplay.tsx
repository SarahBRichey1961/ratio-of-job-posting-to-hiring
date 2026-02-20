import React from 'react'

interface JobBoard {
  id: number
  name: string
  url: string
  category: string
  description: string
}

interface JobBoardsGridProps {
  boards: JobBoard[]
  category?: string
}

export function JobBoardsGrid({ boards }: JobBoardsGridProps) {
  if (boards.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No job boards found</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {boards.map((board) => (
        <div
          key={board.id}
          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
        >
          <h3 className="font-semibold text-lg text-gray-900 mb-2">
            {board.name}
          </h3>
          <p className="text-sm text-gray-600 mb-3">{board.description}</p>
          <div className="flex items-center justify-between">
            <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">
              {board.category}
            </span>
            <a
              href={board.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Visit →
            </a>
          </div>
        </div>
      ))}
    </div>
  )
}

interface CategoryGroupProps {
  categoryName: string
  boards: JobBoard[]
}

export function CategoryGroup({ categoryName, boards }: CategoryGroupProps) {
  const categoryColors: Record<string, string> = {
    general: 'bg-red-50 border-red-200',
    tech: 'bg-blue-50 border-blue-200',
    remote: 'bg-green-50 border-green-200',
    niche: 'bg-purple-50 border-purple-200',
  }

  const categoryTitles: Record<string, string> = {
    general: 'General Job Boards',
    tech: 'Tech-Focused',
    remote: 'Remote-Focused',
    niche: 'Niche Specialties',
  }

  const colorClass = categoryColors[categoryName] || 'bg-gray-50 border-gray-200'

  return (
    <div className={`border rounded-lg p-6 ${colorClass}`}>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        {categoryTitles[categoryName] || categoryName}
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        {boards.length} board{boards.length !== 1 ? 's' : ''}
      </p>
      <JobBoardsGrid boards={boards} category={categoryName} />
    </div>
  )
}
