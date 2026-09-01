import styles from "./loading.module.css";
export default function Loading(){return <div className={`container ${styles.shell}`} aria-hidden="true"><span className={styles.line}/><span className={styles.line}/><div className={styles.cards}><i className={styles.block}/><i className={styles.block}/><i className={styles.block}/></div></div>}
