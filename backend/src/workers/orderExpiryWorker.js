import { getShopEnvironment } from '../config/environment.js';
import { expirePendingOrders } from '../services/orderService.js';

export const startOrderExpiryWorker = () => {
    const { expiryWorkerIntervalSeconds } = getShopEnvironment();
    let isRunning = false;

    const run = async () => {
        if (isRunning) return;
        isRunning = true;
        try {
            await expirePendingOrders();
        } catch (error) {
            console.error(`Order expiry worker failed: ${error.message}`);
        } finally {
            isRunning = false;
        }
    };

    const timer = setInterval(run, expiryWorkerIntervalSeconds * 1000);
    timer.unref();
    void run();
    return () => clearInterval(timer);
};
