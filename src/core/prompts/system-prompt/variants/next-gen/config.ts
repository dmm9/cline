import { isGPT5ModelFamily, isLocalModel, isNextGenModelFamily, isNextGenModelProvider } from "@utils/model-utils"
import { ModelFamily } from "@/shared/prompts"
import { ClineDefaultTool } from "@/shared/tools"
import { SystemPromptSection } from "../../templates/placeholders"
import { SystemPromptContext } from "../../types"
import { createVariant } from "../variant-builder"
import { validateVariant } from "../variant-validator"
import { TEMPLATE_OVERRIDES } from "./template"

// Type-safe variant configuration using the builder pattern
export const config = (context: SystemPromptContext) => {
	const variant = createVariant(ModelFamily.NEXT_GEN, context)
		.description("Prompt tailored to newer frontier models with smarter agentic capabilities.")
		.version(1)
		.tags("next-gen", "advanced", "production")
		.labels({
			stable: 1,
			production: 1,
			advanced: 1,
		})
		.matcher((context) => {
			// Match next-gen models
			const providerInfo = context.providerInfo
			if (isNextGenModelFamily(providerInfo.model.id) && !context.enableNativeToolCalls) {
				return true
			}
			const modelId = providerInfo.model.id
			return (
				!(providerInfo.customPrompt === "compact" && isLocalModel(providerInfo)) &&
				!isNextGenModelProvider(providerInfo) &&
				isNextGenModelFamily(modelId) &&
				!(isGPT5ModelFamily(modelId) && !modelId.includes("chat"))
			)
		})
		.template(TEMPLATE_OVERRIDES.BASE)
		.components(createComponentsFn)
		.tools(createToolsFn)
		.placeholders({
			MODEL_FAMILY: ModelFamily.NEXT_GEN,
		})
		.config({})
		// Override the RULES component with custom template
		.overrideComponent(SystemPromptSection.RULES, {
			template: TEMPLATE_OVERRIDES.RULES,
		})
		.overrideComponent(SystemPromptSection.TOOL_USE, {
			template: TEMPLATE_OVERRIDES.TOOL_USE,
		})
		.overrideComponent(SystemPromptSection.OBJECTIVE, {
			template: TEMPLATE_OVERRIDES.OBJECTIVE,
		})
		.overrideComponent(SystemPromptSection.ACT_VS_PLAN, {
			template: TEMPLATE_OVERRIDES.ACT_VS_PLAN,
		})
		.overrideComponent(SystemPromptSection.FEEDBACK, {
			template: TEMPLATE_OVERRIDES.FEEDBACK,
		})
		.build()

	// Validation
	const validationResult = validateVariant({ ...variant, id: ModelFamily.NEXT_GEN }, { strict: true })
	if (!validationResult.isValid) {
		console.error("Next-gen variant configuration validation failed:", validationResult.errors)
		throw new Error(`Invalid next-gen variant configuration: ${validationResult.errors.join(", ")}`)
	}

	if (validationResult.warnings.length > 0) {
		console.warn("Next-gen variant configuration warnings:", validationResult.warnings)
	}

	return variant
}

const createComponentsFn: (context: SystemPromptContext) => SystemPromptSection[] = (context: SystemPromptContext) => {
	const inlineTools = !(context.providerInfo.model.info.canUseTools && context.enableNativeToolCalls)
	const base = [
		SystemPromptSection.AGENT_ROLE,
		SystemPromptSection.TOOL_USE,
		SystemPromptSection.TASK_PROGRESS,
		inlineTools && SystemPromptSection.MCP,
		SystemPromptSection.EDITING_FILES,
		SystemPromptSection.ACT_VS_PLAN,
		SystemPromptSection.CLI_SUBAGENTS,
		SystemPromptSection.CAPABILITIES,
		SystemPromptSection.FEEDBACK,
		SystemPromptSection.RULES,
		SystemPromptSection.SYSTEM_INFO,
		SystemPromptSection.OBJECTIVE,
		SystemPromptSection.USER_INSTRUCTIONS,
	]
	return base.filter((x) => !!x)
}

const createToolsFn: (context: SystemPromptContext) => ClineDefaultTool[] = (context: SystemPromptContext) => {
	const inlineTools = !(context.providerInfo.model.info.canUseTools && context.enableNativeToolCalls)
	const base = [
		ClineDefaultTool.BASH,
		ClineDefaultTool.FILE_READ,
		ClineDefaultTool.FILE_NEW,
		ClineDefaultTool.FILE_EDIT,
		ClineDefaultTool.SEARCH,
		ClineDefaultTool.LIST_FILES,
		ClineDefaultTool.LIST_CODE_DEF,
		ClineDefaultTool.BROWSER,
		ClineDefaultTool.WEB_FETCH,
		inlineTools && ClineDefaultTool.MCP_USE,
		ClineDefaultTool.MCP_ACCESS,
		ClineDefaultTool.ASK,
		ClineDefaultTool.ATTEMPT,
		ClineDefaultTool.NEW_TASK,
		ClineDefaultTool.PLAN_MODE,
		ClineDefaultTool.MCP_DOCS,
		ClineDefaultTool.TODO,
	]
	return base.filter((x) => !!x)
}

// Export type information for better IDE support
export type NextGenVariantConfig = typeof config
