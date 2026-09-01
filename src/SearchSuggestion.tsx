import React from "react"
import type { Suggestion } from "./SearchBox"
import type { Dispatch, SetStateAction } from 'react'
import airportUrl from "./assets/airport.svg"
import markerUrl from "./assets/marker.svg"
import rptUrl from "./assets/rpt.svg"
import wptUrl from "./assets/wpt.svg"

type SearchSuggestionProps = {
    suggestion: Suggestion,
    setSelectedResult: Dispatch<SetStateAction<Suggestion | null>>
}

const SearchSuggestion = ({suggestion, setSelectedResult}: SearchSuggestionProps) => {

  const icon = chained ternary?
  return (
    <div 
      className="flex flex-col hover:bg-gray-200 hover:cursor-pointer px-3 py-2"
      onClick={() => setSelectedResult(suggestion)}>
        <div className="flex items-center">
            <img 
                className="size-4 mr-1"
                src={icon}
                alt="Feature Icon"/>
          <div className="font-bold text-sm">{suggestion.name}</div>
        </div>
        <div className="text-[12px]">{suggestion.place_formatted}</div>
    </div>
  )
};

export default SearchSuggestion;