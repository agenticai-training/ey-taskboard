// Presentational search control: props in, callbacks out; no HTTP.
export default function SearchBox({ value, onChange, onClear }) {
  return (
    <label className="search-box">
      Search tasks
      <span className="search-box-controls">
        <input
          type="search"
          aria-label="Search tasks"
          placeholder="Search by title, description, or assignee"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          className="search-box-clear"
          onClick={onClear}
          disabled={!value}
          aria-label="Clear search"
        >
          Clear
        </button>
      </span>
    </label>
  )
}
