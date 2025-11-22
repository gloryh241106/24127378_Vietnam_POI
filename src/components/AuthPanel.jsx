import { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig.js';
import './AuthPanel.css';

function AuthPanel() {
	const [mode, setMode] = useState('login');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');

	const handleSubmit = async (event) => {
		event.preventDefault();
		setErrorMessage('');

		if (!email.trim() || !password.trim()) {
			setErrorMessage('Vui lòng nhập email và mật khẩu.');
			return;
		}

		if (mode === 'register' && password !== confirmPassword) {
			setErrorMessage('Mật khẩu xác nhận không khớp.');
			return;
		}

		setIsSubmitting(true);

		try {
			if (mode === 'register') {
				await createUserWithEmailAndPassword(auth, email, password);
			} else {
				await signInWithEmailAndPassword(auth, email, password);
			}
			setEmail('');
			setPassword('');
			setConfirmPassword('');
		} catch (error) {
			setErrorMessage(error.message || 'Không thể xử lý yêu cầu.');
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="auth-overlay">
			<div className="auth-panel">
				<h2>{mode === 'login' ? 'Đăng nhập để tiếp tục' : 'Tạo tài khoản mới'}</h2>
				<p className="auth-panel__subtitle">
					Bạn cần đăng nhập để sử dụng bản đồ, tìm kiếm địa điểm và dịch văn bản.
				</p>
				<form onSubmit={handleSubmit} className="auth-panel__form">
					<label htmlFor="auth-email">Email</label>
					<input
						id="auth-email"
						type="email"
						value={email}
						onChange={(event) => setEmail(event.target.value)}
						autoComplete="email"
						required
					/>
					<label htmlFor="auth-password">Mật khẩu</label>
					<input
						id="auth-password"
						type="password"
						value={password}
						onChange={(event) => setPassword(event.target.value)}
						autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
						required
					/>
					{mode === 'register' && (
						<>
							<label htmlFor="auth-confirm">Xác nhận mật khẩu</label>
							<input
								id="auth-confirm"
								type="password"
								value={confirmPassword}
								onChange={(event) => setConfirmPassword(event.target.value)}
								autoComplete="new-password"
								required
							/>
						</>
					)}
					{errorMessage && <p className="auth-panel__error">{errorMessage}</p>}
					<button type="submit" disabled={isSubmitting}>
						{isSubmitting ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
					</button>
				</form>
				<div className="auth-panel__switch">
					{mode === 'login' ? (
						<button type="button" onClick={() => setMode('register')}>
							Chưa có tài khoản? Đăng ký ngay
						</button>
					) : (
						<button type="button" onClick={() => setMode('login')}>
							Đã có tài khoản? Quay lại đăng nhập
						</button>
					)}
				</div>
			</div>
		</div>
	);
}

export default AuthPanel;
