import React from "react"
import type { ChangeEvent, Dispatch, SetStateAction } from 'react'
import SearchSuggestion from "./SearchSuggestion"
import type { AirportSuggestion } from "./utils/search"
import type { SearchBoxSuggestion } from "@mapbox/search-js-core"

export type Suggestion = SearchBoxSuggestion | AirportSuggestion

type SearchBoxProps = {
    searchInput: string,
    handleChange: (e: ChangeEvent<HTMLInputElement>) => void,
    suggestions: Suggestion[],
    setSelectedResult: Dispatch<SetStateAction<Suggestion | null>>
}

const SearchBox = ({searchInput, handleChange, suggestions, setSelectedResult}: SearchBoxProps) => {
  return (
    <div>
      <input 
        type="text" 
        className="bg-white rounded-lg border border-gray-400 p-3 w-full shadow-sm focus:outline-none focus:ring focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-gray-400 text-gray-700"
        value={searchInput}
        onChange={handleChange}
        placeholder="Search..."
      />

      {suggestions.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-400 w-full shadow-sm mt-1">
          {suggestions.map((suggestion, index) => (
               <SearchSuggestion 
                  key={index}
                  suggestion={suggestion}
                  setSelectedResult={setSelectedResult}/>
          ))}
        </div>
      )}
    </div>
  )
}

export default SearchBox