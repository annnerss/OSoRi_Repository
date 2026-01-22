import { useState } from "react";
import styles from "./LoginPage.module.css";

export default function LoginPage() {
  const [form, setForm] = useState({ id: "", password: "", remember: false });

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    alert("로그인 API 연결하면 됨");
  };

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>OSoRi</h1>

      <form className={styles.form} onSubmit={onSubmit}>
        <div className={styles.field}>
          <div className={styles.label}>아이디</div>
          <input
            className={styles.input}
            name="id"
            value={form.id}
            onChange={onChange}
            placeholder="ID"
          />
        </div>

        <div className={styles.field}>
          <div className={styles.label}>비밀번호</div>
          <input
            className={styles.input}
            type="password"
            name="password"
            value={form.password}
            onChange={onChange}
            placeholder="비밀번호"
          />
        </div>

        <label className={styles.remember}>
          <input type="checkbox" name="remember" checked={form.remember} onChange={onChange} />
          <span>아이디저장</span>
        </label>

        <button className={styles.loginBtn} type="submit">
          로그인
        </button>
      </form>

      <div className={styles.simpleArea}>
        <div className={styles.simpleTitle}>간편 로그인</div>

        <div className={styles.socialRow}>
          <button className={`${styles.socialBtn} ${styles.kakao}`} type="button" aria-label="카카오 로그인">
            <KakaoIcon />
          </button>
          <button className={`${styles.socialBtn} ${styles.naver}`} type="button" aria-label="네이버 로그인">
            <NaverIcon />
          </button>
          
        </div>
      </div>

      <div className={styles.bottomRow}>
        <button className={styles.subBtn} type="button">아이디/비밀번호 찾기</button>
        <button className={styles.subBtn} type="button">회원가입</button>
      </div>
    </div>
  );
}

function KakaoIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3C6.477 3 2 6.58 2 11c0 2.84 1.86 5.34 4.65 6.77-.2.72-.73 2.6-.84 3.02-.13.5.18.5.38.36.16-.1 2.56-1.73 3.6-2.44.73.1 1.48.15 2.21.15 5.523 0 10-3.58 10-8S17.523 3 12 3z"/>
    </svg>
  );
}

function NaverIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14.5 12.6 9.8 5H5v14h4.7V11.4L14.2 19H19V5h-4.5v7.6z"/>
    </svg>
  );
}

