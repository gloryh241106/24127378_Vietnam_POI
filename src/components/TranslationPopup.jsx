import { useEffect, useState } from 'react';
import './TranslationPopup.css';

function TranslationPopup({ isOpen, onClose, onTranslate, isLoading, result, error }) {
	const [inputValue, setInputValue] = useState('');

	useEffect(() => {
		if (!isOpen) {
			setInputValue('');
		}
	}, [isOpen]);

	if (!isOpen) {
		return null;
	}

	const handleSubmit = (event) => {
		event.preventDefault();
		onTranslate?.(inputValue);
	};

	return (
		<div
			className="translator-overlay"
			role="dialog"
			aria-modal="true"
			onClick={onClose}
		>
			<div className="translator-modal" onClick={(event) => event.stopPropagation()}>
				<header className="translator-header">
					<h2>Translate English to Vietnamese</h2>
					<button type="button" className="translator-close" onClick={onClose} aria-label="Close translator">
						X
					</button>
				</header>
				<form onSubmit={handleSubmit} className="translator-form">
					<label htmlFor="translator-input">English sentence</label>
					<textarea
						id="translator-input"
						value={inputValue}
						onChange={(event) => setInputValue(event.target.value)}
						placeholder="Enter your sentence here"
						rows={4}
						required
					/>
					<div className="translator-actions">
						<button type="button" onClick={() => setInputValue('')} disabled={isLoading}>
							Clear
						</button>
						<button type="submit" disabled={isLoading}>
							{isLoading ? 'Translating...' : 'Translate'}
						</button>
					</div>
				</form>
				<section className="translator-result">
					{error && <p className="translator-error">{error}</p>}
					{result && !error && (
						<>
							<h3>Vietnamese</h3>
							<p>{result}</p>
						</>
					)}
				</section>
			</div>
		</div>
	);
}

export default TranslationPopup;
