import React from "react"
import PropTypes from "prop-types"
import { Link as GatsbyLink, navigate as gatsbyNavigate } from "gatsby"
import { IntlContextConsumer } from "./intl-context"

const Link = ({ to, language, children, onClick, ...rest }) => (
  <IntlContextConsumer>
    {intl => {
      
      // artt's edit
      let languageLink = language || intl.language
      if (languageLink === intl.defaultLanguage)
        languageLink = ""

      let link = to
      if ((intl.routed || language) && languageLink) {
        // console.log("xxxx")
        link = `/${languageLink}${to}` 
      }

      // console.log('language', language)
      // console.log('intl.language', intl.language)
      // console.log('languageLink', languageLink)
      // console.log('link', link)

      //const languageLink = language || intl.language
      // const link = intl.routed || language ? `/${languageLink}${to}` : `${to}`

      const handleClick = e => {
        if (language) {
          localStorage.setItem("gatsby-intl-language", language)
        }
        if (onClick) {
          onClick(e)
        }
      }

      return (
        <GatsbyLink {...rest} to={link} onClick={handleClick}>
          {children}
        </GatsbyLink>
      )
    }}
  </IntlContextConsumer>
)

Link.propTypes = {
  children: PropTypes.node.isRequired,
  to: PropTypes.string,
  language: PropTypes.string,
}

Link.defaultProps = {
  to: "",
}

export default Link

export const navigate = (to, options) => {
  if (typeof window === "undefined") {
    return
  }

  const { language, routed } = window.___gatsbyIntl
  const link = routed ? `/${language}${to}` : `${to}`
  gatsbyNavigate(link, options)
}

export const changeLocale = (language, to) => {
  if (typeof window === "undefined") {
    return
  }
  const { defaultLanguage, routed } = window.___gatsbyIntl

  const removePrefix = pathname => {
    const base =
      typeof __BASE_PATH__ !== `undefined` ? __BASE_PATH__ : __PATH_PREFIX__
    if (base && pathname.indexOf(base) === 0) {
      pathname = pathname.slice(base.length)
    }
    return pathname
  }

  const removeLocalePart = pathname => {
    if (!routed) {
      return pathname
    }
    const i = pathname.indexOf(`/`, 1)
    return pathname.substring(i)
  }

  const pathname =
    to || removeLocalePart(removePrefix(window.location.pathname))

  // artt's change
  const link = `${language === defaultLanguage ? "" : `/${language}`}${pathname}${window.location.search}`
  // TODO: check slash
  // const link = `/${language}${pathname}${window.location.search}`

  localStorage.setItem("gatsby-intl-language", language)
  gatsbyNavigate(link)
}


export function useLang() {
  const [lang, setLang] = React.useState(null)
  React.useEffect(() => {
    const intl = window.___gatsbyIntl
    setLang(intl.language)
  }, [])
  return lang
}