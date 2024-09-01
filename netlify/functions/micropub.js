import slugify from 'slugify'
import { Octokit } from '@octokit/rest'

const octokit = new Octokit({ auth: process.env.GITHUB_ACCESS_TOKEN })

const owner = process.env.GITHUB_REPO_OWNER
const repo = process.env.GIT_REPO_NAME
const folder = process.env.POSTS_FOLDER
const collection = process.env.COLLECTION_NAME

exports.handler = async (event) => {
	if (event.httpMethod === 'GET') {
		return { statusCode: 200, body: '{}' }
	}

	if (!event.headers['authorization'] || event.headers['authorization'] != `Bearer ${process.env.SECRET_KEY}`) {
		return { statusCode: 401, body: 'Unauthorized' }
	}

	const body = JSON.parse(event.body)

	const date = new Date()
	const title = body.properties.name[0]
	const content = body.properties.content[0]
	const slug = slugify(title, { replacement: '-', lower: true, strict: true, trim: true })

	const filename = [date.toISOString().split('T')[0], slug].join('-')

	const fileContent = []

	// fontmatter
	if (!content.includes('---')) {
		fileContent.push('---')
		fileContent.push('date: ' + date.toISOString())
		fileContent.push('published: false')
		fileContent.push('title: ' + title)
		fileContent.push('slug: ' + slug)
		fileContent.push('category: note')
		fileContent.push('---')
	}

	const filePath = `${folder}/${filename}.md`

	await octokit.repos.createOrUpdateFileContents({
		owner,
		repo,
		message: 'Adding post: ' + title,
		path: filePath,
		content: Buffer.from(fileContent.join('\n')).toString('base64'),
	})

	return {
		statusCode: 201,
		headers: {
			Location: `https://app.pagescms.org/${owner}/${repo}/main/content/${collection}/edit/${encodeURIComponent(filePath)}`,
		},
	}
}
