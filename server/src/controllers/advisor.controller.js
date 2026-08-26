import { answerAdvisorQuestion } from "../services/advisor.service.js";
import { validateAdvisorRequest } from "../utils/validateAdvisorContext.js";

export async function postAdvisorMessage(req, res) {
  const { language, question, reportContext, recentMessages } = validateAdvisorRequest(req.body);

  const result = await answerAdvisorQuestion({ language, question, reportContext, recentMessages });

  if (result.status === "not-configured") {
    res.status(200).json({
      success: true,
      data: { status: "not-configured", message: "AI Business Advisor is not configured on this environment." },
    });
    return;
  }

  if (result.status === "error") {
    res.status(200).json({
      success: true,
      data: { status: "error", message: result.message },
    });
    return;
  }

  res.status(200).json({ success: true, data: { status: "ok", answer: result.answer } });
}
