// https://claude.ai/chat/1386bc1b-3a7e-4131-9755-c03b33109387
// Modified next command in commands.js
// Replace the existing next command action with this:

programInstance
	.command('next')
	.description(
		`Show the next task to work on based on dependencies and status${chalk.reset('')}`
	)
	.option(
		'-f, --file <file>',
		'Path to the tasks file',
		TASKMASTER_TASKS_FILE
	)
	.option(
		'-r, --report <report>',
		'Path to the complexity report file',
		COMPLEXITY_REPORT_FILE
	)
	.option('--tag <tag>', 'Specify tag context for task operations')
	.action(async (options) => {
		const tasksPath = options.file || TASKMASTER_TASKS_FILE;
		const reportPath = options.report;
		const tag = options.tag;

		const projectRoot = findProjectRoot();
		if (!projectRoot) {
			console.error(chalk.red('Error: Could not find project root.'));
			process.exit(1);
		}

		// Show current tag context
		displayCurrentTagIndicator(tag || getCurrentTag(projectRoot) || 'master');

		// Find the next task first
		const data = readJSON(tasksPath, projectRoot, tag);
		if (!data || !data.tasks) {
			console.error(chalk.red('Error: No valid tasks found'));
			process.exit(1);
		}

		// Read complexity report
		const complexityReport = readComplexityReport(reportPath);

		// Find the next task using the existing function
		const nextTask = findNextTask(data.tasks, complexityReport);

		if (!nextTask) {
			console.log(
				boxen(
					chalk.hex('#FF8800').bold('No eligible next task found') +
						'\n\n' +
						'All pending tasks have dependencies that are not yet completed, or all tasks are done.',
					{
						padding: 1,
						borderColor: '#FF8800',
						borderStyle: 'round',
						margin: { top: 1, bottom: 1 },
						title: '⚡ NEXT TASK ⚡',
						titleAlignment: 'center'
					}
				)
			);
			return;
		}

		// Display header indicating this is the next task
		console.log(
			boxen(
				chalk.white.bold('⚡ NEXT RECOMMENDED TASK ⚡'),
				{
					padding: { top: 0, bottom: 0, left: 1, right: 1 },
					borderColor: '#FF8800',
					borderStyle: 'round',
					margin: { top: 1, bottom: 0 },
					textAlignment: 'center'
				}
			)
		);

		// Use the same detailed display as the show command
		await displayTaskById(
			tasksPath,
			nextTask.id.toString(),
			reportPath,
			null, // statusFilter
			tag,
			{ projectRoot }
		);

		// Show suggested actions for the next task
		console.log(
			boxen(
				chalk.white.bold('Quick Actions:') +
					'\n\n' +
					`${chalk.cyan('Start working:')} ${chalk.yellow(`task-master set-status --id=${nextTask.id} --status=in-progress`)}\n` +
					`${chalk.cyan('Mark as done:')} ${chalk.yellow(`task-master set-status --id=${nextTask.id} --status=done`)}\n` +
					`${chalk.cyan('Expand task:')} ${chalk.yellow(`task-master expand --id=${nextTask.id}`)}`,
				{
					padding: 1,
					borderColor: 'gray',
					borderStyle: 'round',
					margin: { top: 1 }
				}
			)
		);
	});

// You'll also need to import the additional functions at the top of commands.js:
import findNextTask from './find-next-task.js';
import { readComplexityReport } from './utils.js'; // If not already imported