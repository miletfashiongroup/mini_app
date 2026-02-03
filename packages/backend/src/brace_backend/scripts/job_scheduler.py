import asyncio
import logging
import os
from datetime import datetime, timedelta
from brace_backend.scripts import analytics_rollup, analytics_cleanup

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
log = logging.getLogger('job_scheduler')

ROLLUP_INTERVAL = int(os.getenv('BRACE_ROLLUP_INTERVAL_SECONDS', 3600))
CLEANUP_INTERVAL = int(os.getenv('BRACE_CLEANUP_INTERVAL_SECONDS', 86400))

async def run_periodic(fn, interval, name):
    next_run = datetime.utcnow()
    while True:
        now = datetime.utcnow()
        if now >= next_run:
            log.info('job start: %s', name)
            try:
                await asyncio.to_thread(fn.main)
                log.info('job done: %s', name)
            except Exception as exc:  # noqa: BLE001
                log.exception('job failed: %s', name, exc_info=exc)
            next_run = datetime.utcnow() + timedelta(seconds=interval)
        sleep_for = max(1, int((next_run - datetime.utcnow()).total_seconds()))
        await asyncio.sleep(sleep_for)

async def main():
    await asyncio.gather(
        run_periodic(analytics_rollup, ROLLUP_INTERVAL, 'analytics_rollup'),
        run_periodic(analytics_cleanup, CLEANUP_INTERVAL, 'analytics_cleanup'),
    )

if __name__ == '__main__':
    asyncio.run(main())
