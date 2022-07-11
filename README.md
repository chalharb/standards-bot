# Standards Bot

asdf
Are tired of checking to make sure pull requests follow your standards? Me too... That's why I built a Github Action to enforce pull request and commit standards.

## Inputs

| input                       | required | description                                                                                         |
| --------------------------- | -------- | --------------------------------------------------------------------------------------------------- |
| `github-token`              | true     | The GitHub Actions token e.g. `secrets.GITHUB_TOKEN`                                                |
| `pr-title-regex`            | false    | A regular expression that is used to check if pull reuqest title matches the given expression       |
| `pr-title-prefix`           | false    | A string that is used to validate pull request title starts with given string                       |
| `pr-title-min-length`       | false    | A number that checks if pull request title is more than the minimum length                          |
| `pr-title-max-length`       | false    | A number that checks if pull request title is less than the maximum length                          |
| `commit-message-regex`      | false    | A regular expression that is used to check if pull reuqest commits match the given expression       |
| `commit-message-prefix`     | false    | A string that is used to validate all commit messages in a pull request start with the given string |
| `commit-message-min-length` | false    | A number that checks if pull request title is more than the minimum length                          |
| `commit-message-max-length` | false    | A number that checks if pull request title is less than the maximum length                          |

## Usage

See [action.yml](action.yml)

## Validating Pull Request Titles

```yaml
steps:
  - uses: chalharb/first-interaction@v1.x
    with:
      pr-title-regex: '^(build|chore|feat|fix|docs|refactor|perf|style|test):\s[A-Z]{1}'
      pr-title-prefix: 'build,chore,feat,fix,docs,refactor,perf,style,test'
      pr-title-min-length: 10
      pr-title-max-length: 70
      github-token: ${{ secrets.GITHUB_TOKEN }}
```

## Validating Commit Messages

```yaml
steps:
  - uses: chalharb/first-interaction@v1.x
    with:
      commit-message-regex: '^(build|chore|feat|fix|docs|refactor|perf|style|test):\s[A-Z]{1}'
      commit-message-prefix: 'build,chore,feat,fix,docs,refactor,perf,style,test'
      commit-min-length: 10
      commit-max-length: 100
      github-token: ${{ secrets.GITHUB_TOKEN }}
```

## Validating Pull Request Titles and Commit Messages

```yaml
steps:
  - uses: chalharb/first-interaction@v1.x
    with:
      pr-title-regex: '^(build|chore|feat|fix|docs|refactor|perf|style|test):\s[A-Z]{1}'
      pr-title-prefix: 'build,chore,feat,fix,docs,refactor,perf,style,test'
      pr-title-min-length: 10
      pr-title-max-length: 70
      commit-message-regex: '^(build|chore|feat|fix|docs|refactor|perf|style|test):\s[A-Z]{1}'
      commit-message-prefix: 'build,chore,feat,fix,docs,refactor,perf,style,test'
      commit-min-length: 10
      commit-max-length: 100
      github-token: ${{ secrets.GITHUB_TOKEN }}
```

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)
