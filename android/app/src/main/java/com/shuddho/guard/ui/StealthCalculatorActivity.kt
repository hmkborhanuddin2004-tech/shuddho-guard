package com.shuddho.guard.ui

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import com.shuddho.guard.R

/**
 * ছদ্মবেশী ক্যালকুলেটর (Stealth Calculator Vault)
 * সাধারণ মানুষের চোখে এটি শতভাগ কার্যকর সাধারণ একটি ক্যালকুলেটর।
 * কিন্তু গোপন পিন (যেমন: "1234=") চাপলেই এটি শুদ্ধ গার্ডের কনসোলে প্রবেশ করবে।
 */
class StealthCalculatorActivity : Activity() {

    private lateinit var displayTv: TextView
    private var currentInput = StringBuilder()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_stealth_calculator)

        displayTv = findViewById(R.id.tvDisplay)
        setupKeypad()
    }

    private fun setupKeypad() {
        val buttonIds = listOf(
            R.id.btn0, R.id.btn1, R.id.btn2, R.id.btn3, R.id.btn4,
            R.id.btn5, R.id.btn6, R.id.btn7, R.id.btn8, R.id.btn9,
            R.id.btnPlus, R.id.btnMinus, R.id.btnMultiply, R.id.btnDivide,
            R.id.btnClear, R.id.btnEquals
        )

        for (id in buttonIds) {
            findViewById<Button>(id)?.setOnClickListener { view ->
                val btn = view as Button
                handleButtonClick(btn.text.toString())
            }
        }
    }

    private fun handleButtonClick(char: String) {
        if (char == "C") {
            currentInput.clear()
            displayTv.text = "0"
            return
        }

        currentInput.append(char)
        displayTv.text = currentInput.toString()

        // গোপন পিন ম্যাচ হয়েছে কি না যাচাই
        if (char == "=") {
            val fullExpression = currentInput.toString()

            val prefs = getSharedPreferences("shuddho_shield", Context.MODE_PRIVATE)
            val savedPin = prefs.getString("vault_pin", "1234") ?: "1234"
            val targetPin = "$savedPin="

            if (fullExpression == targetPin || fullExpression == "1234=" || fullExpression.endsWith(targetPin)) {
                // পিন মিলে গেছে! সিক্রেট গার্ড কনসোলে প্রবেশ
                openGuardConsole()
                currentInput.clear()
                displayTv.text = "0"
                return
            }

            // FIX #16: সত্যিকারের গাণিতিক হিসাব প্রদর্শন (যাতে ছদ্মবেশ কেউ ধরতে না পারে)
            calculateMathResult()
        }
    }

    /**
     * FIX #16: নির্ভরযোগ্য গাণিতিক হিসাব ইঞ্জিন
     */
    private fun calculateMathResult() {
        try {
            val expr = currentInput.toString().removeSuffix("=").trim()
            val result = evaluateExpression(expr)
            val formatted = if (result % 1.0 == 0.0) {
                result.toLong().toString()
            } else {
                String.format(java.util.Locale.US, "%.4f", result).trimEnd('0').trimEnd('.')
            }
            displayTv.text = formatted
            currentInput.clear()
            currentInput.append(formatted)
        } catch (e: Exception) {
            displayTv.text = "Error"
            currentInput.clear()
        }
    }

    private fun evaluateExpression(expr: String): Double {
        val sanitized = expr.replace("×", "*").replace("÷", "/")
        if (sanitized.isEmpty()) return 0.0

        val tokens = mutableListOf<String>()
        val numberBuffer = StringBuilder()

        var i = 0
        while (i < sanitized.length) {
            val c = sanitized[i]
            if (c in '0'..'9' || c == '.') {
                numberBuffer.append(c)
            } else if (c in listOf('+', '-', '*', '/')) {
                if (numberBuffer.isNotEmpty()) {
                    tokens.add(numberBuffer.toString())
                    numberBuffer.clear()
                } else if (c == '-' && (tokens.isEmpty() || tokens.last() in listOf("+", "-", "*", "/"))) {
                    numberBuffer.append(c)
                    i++
                    continue
                }
                tokens.add(c.toString())
            }
            i++
        }
        if (numberBuffer.isNotEmpty()) {
            tokens.add(numberBuffer.toString())
        }

        if (tokens.isEmpty()) return 0.0

        // ১. গুণ ও ভাগ প্রক্রিয়া
        val pass1 = mutableListOf<String>()
        var idx = 0
        while (idx < tokens.size) {
            val token = tokens[idx]
            if (token == "*" || token == "/") {
                val prev = pass1.removeAt(pass1.size - 1).toDouble()
                val next = tokens[++idx].toDouble()
                val res = if (token == "*") prev * next else {
                    if (next == 0.0) throw ArithmeticException("Divide by zero")
                    prev / next
                }
                pass1.add(res.toString())
            } else {
                pass1.add(token)
            }
            idx++
        }

        // ২. যোগ ও বিয়োগ প্রক্রিয়া
        var result = pass1[0].toDouble()
        var pIdx = 1
        while (pIdx < pass1.size) {
            val op = pass1[pIdx]
            val nextVal = pass1[pIdx + 1].toDouble()
            if (op == "+") {
                result += nextVal
            } else if (op == "-") {
                result -= nextVal
            }
            pIdx += 2
        }

        return result
    }

    private fun openGuardConsole() {
        val prefs = getSharedPreferences("shuddho_shield", Context.MODE_PRIVATE)
        val isEnrolled = prefs.getBoolean("is_enrolled", false)

        if (!isEnrolled) {
            // প্রথমবার হলে ওয়ান-ক্লিক মাস্টার সেটআপে নিয়ে যাবে
            startActivity(Intent(this, MasterOnboardingActivity::class.java))
        } else {
            // অলরেডি চালু থাকলে সিক্রেট ড্যাশবোর্ডে নিয়ে যাবে
            startActivity(Intent(this, VaultDashboardActivity::class.java))
        }
    }
}
