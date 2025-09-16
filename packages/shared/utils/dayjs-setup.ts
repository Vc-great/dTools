import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime.js";
import timezone from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc.js";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

// 可选：设置默认时区
dayjs.tz.setDefault("UTC");

//dayjs.utc(createdAt).local().format("YYYY-MM-DD HH:mm:ss")

//const now = dayjs().tz("Asia/Shanghai").format("YYYY-MM-DD HH:mm:ss");
