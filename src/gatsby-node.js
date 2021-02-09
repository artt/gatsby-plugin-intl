const webpack = require("webpack")

function flattenMessages(nestedMessages, prefix = "") {
  return Object.keys(nestedMessages).reduce((messages, key) => {
    let value = nestedMessages[key]
    let prefixedKey = prefix ? `${prefix}.${key}` : key

    if (typeof value === "string") {
      messages[prefixedKey] = value
    } else {
      Object.assign(messages, flattenMessages(value, prefixedKey))
    }

    return messages
  }, {})
}

exports.onCreateWebpackConfig = ({ actions, plugins }, pluginOptions) => {
  const { redirectComponent = null, languages, defaultLanguage } = pluginOptions
  if (!languages.includes(defaultLanguage)) {
    languages.push(defaultLanguage)
  }
  const regex = new RegExp(languages.map(l => l.split("-")[0]).join("|"))
  actions.setWebpackConfig({
    plugins: [
      plugins.define({
        GATSBY_INTL_REDIRECT_COMPONENT_PATH: JSON.stringify(redirectComponent),
      }),
      new webpack.ContextReplacementPlugin(
        /@formatjs[/\\]intl-relativetimeformat[/\\]dist[/\\]locale-data$/,
        regex
      ),
      new webpack.ContextReplacementPlugin(
        /@formatjs[/\\]intl-pluralrules[/\\]dist[/\\]locale-data$/,
        regex
      ),
    ],
  })
}

exports.onCreatePage = async ({ page, actions }, pluginOptions) => {
  //Exit if the page has already been processed.
  if (typeof page.context.intl === "object") {
    return
  }
  const { createPage, deletePage } = actions
  const {
    path = ".",
    languages = ["en"],
    defaultLanguage = "en",
    redirect = false,
    dontTranslate = [],
    genDefaultLanguagePages = false,
  } = pluginOptions

  const getMessages = (path, language) => {
    try {
      // TODO load yaml here
      const messages = require(`${path}/${language}.json`)

      return flattenMessages(messages)
    } catch (error) {
      if (error.code === "MODULE_NOT_FOUND") {
        process.env.NODE_ENV !== "test" &&
          console.error(
            `[gatsby-plugin-intl] couldn't find file "${path}/${language}.json"`
          )
      }

      throw error
    }
  }

  const generatePage = (routed, language, availableLanguages) => {
    const messages = getMessages(path, language)
    const newPath = routed ? `/${language}${page.path}` : page.path
    const pageLanguages = availableLanguages ? availableLanguages : languages
    const orgPath = page.fields.originalPath || page.path
    return {
      ...page,
      path: newPath,
      context: {
        ...page.context,
        language,
        intl: {
          language,
          languages: pageLanguages,
          messages,
          routed,
          originalPath: orgPath, //page.path,
          redirect,
          defaultLanguage,
        },
      },
    }
  }

  if (dontTranslate.indexOf(page.path) > -1) {
    const newPage = generatePage(false, defaultLanguage, [defaultLanguage])
    deletePage(page)
    createPage(newPage)
    return
  }

  if (page.context.availableLanguages) {
    const newPage = generatePage(page.context.lang !== defaultLanguage, page.context.lang, page.context.availableLanguages)
    deletePage(page)
    createPage(newPage)
    return
  }

  const newPage = generatePage(false, defaultLanguage, false)
  deletePage(page)
  createPage(newPage)

  languages.forEach(language => {
    if (!genDefaultLanguagePages && language === defaultLanguage)
      return
    const localePage = generatePage(true, language)
    const regexp = new RegExp("/404/?$")
    if (regexp.test(localePage.path)) {
      localePage.matchPath = `/${language}/*`
    }
    createPage(localePage)
  })
}