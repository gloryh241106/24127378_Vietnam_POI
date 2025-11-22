import { useState } from 'react';
import './LocationForm.css';

function LocationForm({ onSearch, isLoading, isDisabled }) {
	const [value, setValue] = useState('');

	const handleSubmit = (event) => {
		event.preventDefault();
		if (!isDisabled) {
			onSearch?.(value);
		}
	};

	return (
		<form className="location-form" onSubmit={handleSubmit}>
			<label htmlFor="location-input">Location in Vietnam</label>
			<div className="location-form__controls">
				<input
					id="location-input"
					type="text"
					placeholder="e.g. Ho Chi Minh City"
					value={value}
					onChange={(event) => setValue(event.target.value)}
					disabled={isLoading || isDisabled}
				/>
				<button type="submit" disabled={isLoading || isDisabled}>
					{isLoading ? 'Searching...' : 'Search'}
				</button>
			</div>
		</form>
	);
}

export default LocationForm;
