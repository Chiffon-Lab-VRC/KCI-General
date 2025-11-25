import styles from './ProjectCard.module.css';

const ProjectCard = ({ title, description, links }) => {
    return (
        <div className={styles.card}>
            <h3 className={styles.title}>{title}</h3>
            <p className={styles.description}>{description}</p>
            <div className={styles.links}>
                {links.map((link, index) => (
                    <a key={index} href={link.url} target="_blank" rel="noopener noreferrer" className={styles.link}>
                        {link.label}
                    </a>
                ))}
            </div>
        </div>
    );
};

export default ProjectCard;
