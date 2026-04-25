/**
 * Built-in Hook: Session Classifier
 * Event: user_prompt_submit, session_start
 * 
 * Automatically categorizes sessions based on the content of the user prompt
 * and the channel type. This enables organized navigation in the UI and
 * differentiated pruning/model routing in the backend.
 * 
 * Capabilities:
 * - Detects 'lead_gen' intent for WhatsApp/Facebook
 * - Detects 'support' intent for technical issues
 * - Identifies 'ops' for internal coordination
 */

function fire(event) {
  var rawInput = event.rawInput || "";
  var channel = event.channel || "";
  var currentCategory = event.metadata ? event.metadata.category : "";

  // 1. WhatsApp/Facebook are initially tagged as 'inbound' (leads)
  var isLeadChannel = channel.indexOf("whatsapp") !== -1 || channel.indexOf("facebook") !== -1;
  
  // 2. Keyword-based intent detection for re-classification
  var inputLower = rawInput.toLowerCase();
  
  // Potential Lead Conversion
  var leadKeywords = ["precio", "costo", "comprar", "información", "interesado", "piso", "alquiler", "renta"];
  var isLeadIntent = false;
  for (var i = 0; i < leadKeywords.length; i++) {
    if (inputLower.indexOf(leadKeywords[i]) !== -1) {
      isLeadIntent = true;
      break;
    }
  }

  // Potential Support Request
  var supportKeywords = ["error", "problema", "fallo", "ayuda", "no funciona", "ticket", "soporte"];
  var isSupportIntent = false;
  for (var j = 0; j < supportKeywords.length; j++) {
    if (inputLower.indexOf(supportKeywords[j]) !== -1) {
      isSupportIntent = true;
      break;
    }
  }

  var updatedCategory = "";

  if (isLeadChannel || isLeadIntent) {
    updatedCategory = "inbound";
  } else if (isSupportIntent) {
    updatedCategory = "support";
  }

  // Only propose update if it differs from current or if we have a strong match
  if (updatedCategory && updatedCategory !== currentCategory) {
    return {
      decision: "allow",
      reason: "Automated intent classification: " + updatedCategory,
      updatedCategory: updatedCategory,
      updatedMetadata: {
        "auto_classified_at": new Date().toISOString(),
        "intent_detected": isLeadIntent ? "lead" : (isSupportIntent ? "support" : "other")
      }
    };
  }

  return { decision: "allow" };
}
