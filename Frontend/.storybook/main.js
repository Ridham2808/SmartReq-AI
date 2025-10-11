/** @type {import('@storybook/nextjs').StorybookConfig} */
module.exports = {
  stories: ['../components/**/*.stories.@(js|jsx)'],
  addons: ['@storybook/addon-links', '@storybook/addon-essentials', '@storybook/addon-interactions'],
  framework: {
    name: '@storybook/nextjs',
    options: {}
  },
  docs: { autodocs: 'tag' }
}


