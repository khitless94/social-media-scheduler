import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

interface PostFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  platformFilter: string;
  setPlatformFilter: (platform: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
}

export const PostFilters = ({
  searchTerm,
  setSearchTerm,
  platformFilter,
  setPlatformFilter,
  statusFilter,
  setStatusFilter
}: PostFiltersProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search posts"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-10 h-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="w-40 h-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg">
            <SelectValue placeholder="All platforms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            <SelectItem value="linkedin">LinkedIn</SelectItem>
            <SelectItem value="twitter">Twitter</SelectItem>
            <SelectItem value="instagram">Instagram</SelectItem>
            <SelectItem value="facebook">Facebook</SelectItem>
            <SelectItem value="reddit">Reddit</SelectItem>
          </SelectContent>
        </Select>

        <div className="text-sm text-gray-500 flex items-center">
          0 - 0 of 0
        </div>
      </div>
    </div>
  );
};