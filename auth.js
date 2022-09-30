const setupQueueListeners = async (ACTION_QUEUES) => {
  _(ACTION_QUEUES)
    .mapValues((queue) => {
      if (entityRefreshQueues[queue.name]) {
        queue.on('failed', (job, err) => {
        queue.on('failed', async (job, err) => {
          if (job.attemptsMade === job.opts.attempts) {
            const finishedTimeStamp = job.finishedOn
            const message = slackCustomMessage(
              job.data.action.type,
              job.data.actorUser.org.Name,
              finishedTimeStamp,
              job.attemptsMade,
              job.opts.attempts,
              job.data.jobId
            )
            const message = await _getFailureMessage(job)
            try {
              sendSlackNotification({
                ctx,
