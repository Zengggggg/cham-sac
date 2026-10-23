import characterOne from '../../assets/characters/image-removebg-preview (1).png'
import characterTwo from '../../assets/characters/image-removebg-preview (2).png'
import characterThree from '../../assets/characters/image-removebg-preview (3).png'
import characterFive from '../../assets/characters/image-removebg-preview (5).png'
import './FloatingCharacter.scss'

const characters = [characterOne, characterTwo, characterThree, characterFive]

export default function FloatingCharacter({ variant = 0, className = '', alt = '' }) {
  return <img className={`floating-character floating-character--${variant} ${className}`} src={characters[variant % characters.length]} alt={alt} aria-hidden={!alt} />
}
