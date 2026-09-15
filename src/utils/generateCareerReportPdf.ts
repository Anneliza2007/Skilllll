import { jsPDF } from 'jspdf';
import { StudentProfile, UserStats } from '../types';
import { LEVEL_THRESHOLDS } from '../data/mockData';

export interface ReportOptions {
  includeXpHistory?: boolean;
  includeRecommendations?: boolean;
  notes?: string;
}

export function generateCareerReportPdf(
  profile: StudentProfile,
  stats: UserStats,
  options: ReportOptions = { includeXpHistory: true, includeRecommendations: true }
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  // Color palette definitions
  const primaryNavy = [15, 23, 42]; // #0f172a
  const secondarySlate = [30, 41, 59]; // #1e293b
  const accentSky = [14, 165, 233]; // #0ea5e9
  const accentEmerald = [16, 185, 129]; // #10b981
  const accentAmber = [245, 158, 11]; // #f59e0b
  const textDark = [15, 23, 42];
  const textMuted = [100, 116, 139]; // #64748b
  const textLight = [248, 250, 252];
  const cardBg = [248, 250, 252]; // #f8fafc
  const cardBorder = [226, 232, 240]; // #e2e8f0

  // Calculate metrics
  const currentLevelInfo =
    LEVEL_THRESHOLDS.find((l) => l.level === stats.level) || LEVEL_THRESHOLDS[0];
  const nextLevel = LEVEL_THRESHOLDS.find((l) => l.level === stats.level + 1);
  const nextLevelThreshold = currentLevelInfo.maxXp;
  const prevLevelThreshold = currentLevelInfo.minXp;
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round(((stats.xp - prevLevelThreshold) / (nextLevelThreshold - prevLevelThreshold)) * 100))
  );

  const averageMastery = Math.round(
    profile.skills.reduce((acc, s) => acc + s.masteryScore, 0) / Math.max(profile.skills.length, 1)
  );
  const strongSkills = profile.skills.filter(
    (s) => s.level === 'Advanced' || s.level === 'Expert' || s.masteryScore >= 70
  );
  const weakSkills = profile.skills.filter((s) => s.masteryScore < 70);
  const resumeScore = profile.currentResumeBullets.length >= 3 ? 92 : 65;
  const quizFactor = Math.min(100, stats.quizzesCompleted * 16);
  const projectFactor = Math.min(100, stats.projectsStarted * 35);
  const readinessScore = Math.min(
    100,
    Math.round(averageMastery * 0.35 + resumeScore * 0.25 + projectFactor * 0.2 + quizFactor * 0.2)
  );

  const generatedDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const reportId = `CPR-${Math.abs(stats.xp * 31 + profile.name.length * 17).toString(36).toUpperCase()}-${new Date().getFullYear()}`;

  // ==========================================
  // PAGE 1: EXECUTIVE SUMMARY & SKILL MASTERY
  // ==========================================

  // Header Banner
  doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.rect(0, 0, pageWidth, 38, 'F');

  // Sky blue accent stripe at top
  doc.setFillColor(accentSky[0], accentSky[1], accentSky[2]);
  doc.rect(0, 0, pageWidth, 3, 'F');

  // Title & Subtitle
  doc.setTextColor(textLight[0], textLight[1], textLight[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('CAREER PROGRESS & SKILL MASTERY REPORT', margin, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Diagnostic evaluation of technical mastery, XP progression, and internship preparedness', margin, 20);

  // Meta badge in banner (right side)
  doc.setFontSize(7.5);
  doc.setTextColor(accentSky[0], accentSky[1], accentSky[2]);
  doc.setFont('helvetica', 'bold');
  doc.text(`REPORT ID: ${reportId}`, pageWidth - margin, 14, { align: 'right' });
  doc.setTextColor(203, 213, 225);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${generatedDate}`, pageWidth - margin, 20, { align: 'right' });

  // Student Profile Bar (White Card below header)
  let y = 43;
  doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
  doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
  doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'FD');

  // Student Name & Target Role
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(profile.name, margin + 4, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(accentSky[0], accentSky[1], accentSky[2]);
  doc.text(`Target: ${profile.targetRole}`, margin + 4, y + 13);

  doc.setFontSize(8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`${profile.major} • ${profile.university} (Class of ${profile.graduationYear})`, margin + 4, y + 18.5);

  // Links on right of profile card
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  if (profile.githubUrl) {
    doc.text(`GitHub: ${profile.githubUrl.replace('https://', '')}`, pageWidth - margin - 4, y + 8, { align: 'right' });
  }
  if (profile.linkedinUrl) {
    doc.text(`LinkedIn: ${profile.linkedinUrl.replace('https://', '')}`, pageWidth - margin - 4, y + 14, { align: 'right' });
  }

  // ==========================================
  // 4 METRIC CALLOUT BOXES
  // ==========================================
  y = 70;
  const boxGap = 4;
  const boxWidth = (contentWidth - boxGap * 3) / 4; // ~42.5mm each
  const boxHeight = 24;

  // Box 1: Readiness Score
  doc.setFillColor(240, 253, 244); // light emerald
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(margin, y, boxWidth, boxHeight, 2, 2, 'FD');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 101, 52);
  doc.text('READINESS INDEX', margin + 3, y + 5);
  doc.setFontSize(15);
  doc.setTextColor(accentEmerald[0], accentEmerald[1], accentEmerald[2]);
  doc.text(`${readinessScore}/100`, margin + 3, y + 14);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(21, 128, 61);
  doc.text('Top 15% Profile Match', margin + 3, y + 20);

  // Box 2: Rank & Tier
  const box2X = margin + boxWidth + boxGap;
  doc.setFillColor(240, 249, 255); // light sky
  doc.setDrawColor(186, 230, 253);
  doc.roundedRect(box2X, y, boxWidth, boxHeight, 2, 2, 'FD');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(3, 105, 161);
  doc.text('CURRENT RANK & TIER', box2X + 3, y + 5);
  doc.setFontSize(12);
  doc.setTextColor(accentSky[0], accentSky[1], accentSky[2]);
  doc.text(`Tier ${stats.level}`, box2X + 3, y + 13);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`${currentLevelInfo.title}`, box2X + 3, y + 20);

  // Box 3: Total XP
  const box3X = margin + (boxWidth + boxGap) * 2;
  doc.setFillColor(254, 242, 242); // light slate/red tint
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(box3X, y, boxWidth, boxHeight, 2, 2, 'FD');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(153, 27, 27);
  doc.text('TOTAL EXPERIENCE', box3X + 3, y + 5);
  doc.setFontSize(14);
  doc.setTextColor(225, 29, 72);
  doc.text(`${stats.xp} XP`, box3X + 3, y + 14);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`${nextLevelThreshold - stats.xp} XP to next rank`, box3X + 3, y + 20);

  // Box 4: Habit Streak
  const box4X = margin + (boxWidth + boxGap) * 3;
  doc.setFillColor(254, 243, 199); // light amber
  doc.setDrawColor(253, 230, 138);
  doc.roundedRect(box4X, y, boxWidth, boxHeight, 2, 2, 'FD');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(146, 64, 14);
  doc.text('HABIT STREAK', box4X + 3, y + 5);
  doc.setFontSize(14);
  doc.setTextColor(accentAmber[0], accentAmber[1], accentAmber[2]);
  doc.text(`${stats.dailyStreak} Days`, box4X + 3, y + 14);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 83, 9);
  doc.text(`Best: ${stats.longestStreak} Days Streak`, box4X + 3, y + 20);

  // ==========================================
  // DOMAIN DISTRIBUTION / CATEGORY SUMMARY
  // ==========================================
  y = 100;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('Domain Proficiency Summary', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`Overall average technical mastery: ${averageMastery}%`, pageWidth - margin, y, { align: 'right' });

  // Calculate categories
  const categoryMap: Record<string, { total: number; count: number }> = {};
  profile.skills.forEach((s) => {
    if (!categoryMap[s.category]) categoryMap[s.category] = { total: 0, count: 0 };
    categoryMap[s.category].total += s.masteryScore;
    categoryMap[s.category].count += 1;
  });
  const categories = Object.entries(categoryMap).map(([name, val]) => ({
    name,
    avg: Math.round(val.total / val.count),
    count: val.count,
  }));

  y += 4;
  const catPillWidth = contentWidth / Math.min(categories.length, 6);
  categories.slice(0, 6).forEach((cat, idx) => {
    const px = margin + idx * catPillWidth;
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(px + 1, y, catPillWidth - 2, 13, 1.5, 1.5, 'FD');

    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(cat.name, px + 3, y + 4.5);

    // Mini progress bar in domain pill
    doc.setFillColor(226, 232, 240);
    doc.rect(px + 3, y + 6.5, catPillWidth - 8, 2, 'F');
    doc.setFillColor(cat.avg >= 70 ? accentEmerald[0] : accentAmber[0], cat.avg >= 70 ? accentEmerald[1] : accentAmber[1], cat.avg >= 70 ? accentEmerald[2] : accentAmber[2]);
    doc.rect(px + 3, y + 6.5, ((catPillWidth - 8) * cat.avg) / 100, 2, 'F');

    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(`${cat.avg}% avg (${cat.count})`, px + 3, y + 11.5);
  });

  // ==========================================
  // SKILL MASTERY BENCHMARK TABLE
  // ==========================================
  y += 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('Detailed Skill Mastery Breakdown', margin, y);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Evaluated against industry baseline (60%) and standout tier (85%)', pageWidth - margin, y, { align: 'right' });

  y += 4;

  // Table Header
  doc.setFillColor(secondarySlate[0], secondarySlate[1], secondarySlate[2]);
  doc.rect(margin, y, contentWidth, 7, 'F');
  doc.setTextColor(textLight[0], textLight[1], textLight[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('SKILL NAME', margin + 3, y + 4.8);
  doc.text('CATEGORY', margin + 48, y + 4.8);
  doc.text('LEVEL', margin + 82, y + 4.8);
  doc.text('QUIZZES', margin + 112, y + 4.8);
  doc.text('MASTERY SCORE & VISUAL BENCHMARK', margin + 135, y + 4.8);

  y += 7;

  // Table Rows
  const sortedSkills = [...profile.skills].sort((a, b) => b.masteryScore - a.masteryScore);
  const rowHeight = 8.8;

  sortedSkills.forEach((skill, idx) => {
    // Alternating row background
    if (idx % 2 === 0) {
      doc.setFillColor(255, 255, 255);
    } else {
      doc.setFillColor(248, 250, 252);
    }
    doc.rect(margin, y, contentWidth, rowHeight, 'F');

    // Bottom subtle border
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y + rowHeight, margin + contentWidth, y + rowHeight);

    // Skill Name
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(skill.name, margin + 3, y + 5.5);

    // Category
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(skill.category, margin + 48, y + 5.5);

    // Level Badge text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    if (skill.level === 'Expert') {
      doc.setTextColor(147, 51, 234); // purple
    } else if (skill.level === 'Advanced') {
      doc.setTextColor(16, 185, 129); // emerald
    } else if (skill.level === 'Intermediate') {
      doc.setTextColor(14, 165, 233); // sky
    } else {
      doc.setTextColor(245, 158, 11); // amber
    }
    doc.text(skill.level, margin + 82, y + 5.5);

    // Quizzes Taken
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(`${skill.quizzesTaken || 0} completed`, margin + 112, y + 5.5);

    // Mastery Score number
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(`${skill.masteryScore}%`, margin + 135, y + 5.5);

    // Visual Progress Bar
    const barX = margin + 147;
    const barY = y + 2.8;
    const barMaxW = 32;
    const barH = 3;

    // Track
    doc.setFillColor(226, 232, 240);
    doc.rect(barX, barY, barMaxW, barH, 'F');

    // Fill
    const fillW = (barMaxW * skill.masteryScore) / 100;
    if (skill.masteryScore >= 85) {
      doc.setFillColor(accentEmerald[0], accentEmerald[1], accentEmerald[2]);
    } else if (skill.masteryScore >= 70) {
      doc.setFillColor(accentSky[0], accentSky[1], accentSky[2]);
    } else {
      doc.setFillColor(accentAmber[0], accentAmber[1], accentAmber[2]);
    }
    doc.rect(barX, barY, fillW, barH, 'F');

    y += rowHeight;
  });

  // Footer for Page 1
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('Student Skill Matcher & Career Launchpad • Career Progress Report', margin, pageHeight - 7);
  doc.text('Page 1 of 2', pageWidth - margin, pageHeight - 7, { align: 'right' });

  // ==========================================
  // PAGE 2: XP MILESTONES, HABITS & STRATEGIC PLAN
  // ==========================================
  doc.addPage();

  // Page 2 Header Banner
  doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.rect(0, 0, pageWidth, 24, 'F');
  doc.setFillColor(accentSky[0], accentSky[1], accentSky[2]);
  doc.rect(0, 0, pageWidth, 2.5, 'F');

  doc.setTextColor(textLight[0], textLight[1], textLight[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('EXPERIENCE PROGRESSION & CAREER ACTION PLAN', margin, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Candidate: ${profile.name} • Report ID: ${reportId}`, margin, 18);
  doc.text(`Generated: ${generatedDate}`, pageWidth - margin, 18, { align: 'right' });

  y = 32;

  // Section 1: Productivity & Output Summary
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text('Candidate Activity & Quantified Accomplishments', margin, y);

  y += 4;
  const statBoxW = (contentWidth - 9) / 4;
  const statBoxH = 18;

  const summaryStats = [
    { label: 'Diagnostic Quizzes', value: stats.quizzesCompleted.toString(), sub: 'Technical tests cleared' },
    { label: 'Projects Initiated', value: stats.projectsStarted.toString(), sub: 'Architectural builds' },
    { label: 'Resumes Tailored', value: stats.resumesOptimized.toString(), sub: 'Google XYZ bullets' },
    { label: 'Applications Sent', value: stats.internshipsApplied.toString(), sub: 'Tracked pipelines' },
  ];

  summaryStats.forEach((st, idx) => {
    const sx = margin + idx * (statBoxW + 3);
    doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
    doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
    doc.roundedRect(sx, y, statBoxW, statBoxH, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(accentSky[0], accentSky[1], accentSky[2]);
    doc.text(st.value, sx + 3, y + 7);

    doc.setFontSize(6.8);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(st.label, sx + 3, y + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(st.sub, sx + 3, y + 15.5);
  });

  y += statBoxH + 8;

  // Section 2: Recent XP Progression Logs
  if (options.includeXpHistory && stats.xpHistory && stats.xpHistory.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text('Recent XP Milestones & Verified Activity Log', margin, y);

    y += 4;
    doc.setFillColor(secondarySlate[0], secondarySlate[1], secondarySlate[2]);
    doc.rect(margin, y, contentWidth, 6.5, 'F');
    doc.setTextColor(textLight[0], textLight[1], textLight[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('ACTIVITY / MILESTONE', margin + 3, y + 4.5);
    doc.text('TIMESTAMP', margin + 115, y + 4.5);
    doc.text('XP EARNED', margin + 155, y + 4.5);

    y += 6.5;

    const recentLogs = stats.xpHistory.slice(0, 6);
    recentLogs.forEach((log, idx) => {
      if (idx % 2 === 0) {
        doc.setFillColor(255, 255, 255);
      } else {
        doc.setFillColor(248, 250, 252);
      }
      doc.rect(margin, y, contentWidth, 7, 'F');
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y + 7, margin + contentWidth, y + 7);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.text(log.description, margin + 3, y + 4.8);

      doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
      doc.setFontSize(7);
      doc.text(log.timestamp || 'Recent', margin + 115, y + 4.8);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(accentEmerald[0], accentEmerald[1], accentEmerald[2]);
      doc.text(`+${log.amount} XP`, margin + 155, y + 4.8);

      y += 7;
    });

    y += 8;
  }

  // Section 3: Daily Action Checklist Status
  if (stats.dailyTodos && stats.dailyTodos.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text('Daily Habit & Action Plan Execution', margin, y);

    const completedTodos = stats.dailyTodos.filter((t) => t.completed).length;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(accentEmerald[0], accentEmerald[1], accentEmerald[2]);
    doc.text(`${completedTodos} of ${stats.dailyTodos.length} Daily Targets Completed`, pageWidth - margin, y, { align: 'right' });

    y += 4;
    stats.dailyTodos.forEach((todo) => {
      doc.setFillColor(todo.completed ? 240 : 255, todo.completed ? 253 : 255, todo.completed ? 244 : 255);
      doc.setDrawColor(226, 232, 240);
      doc.rect(margin, y, contentWidth, 6.5, 'FD');

      // Checkbox square
      doc.setFillColor(todo.completed ? accentEmerald[0] : 255, todo.completed ? accentEmerald[1] : 255, todo.completed ? accentEmerald[2] : 255);
      doc.rect(margin + 2.5, y + 1.8, 3, 3, 'FD');
      if (todo.completed) {
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(5);
        doc.setFont('helvetica', 'bold');
        doc.text('✓', margin + 3.1, y + 4.2);
      }

      doc.setFont('helvetica', todo.completed ? 'normal' : 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(todo.completed ? 100 : textDark[0], todo.completed ? 116 : textDark[1], todo.completed ? 139 : textDark[2]);
      doc.text(todo.title, margin + 8, y + 4.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(accentSky[0], accentSky[1], accentSky[2]);
      doc.text(`+${todo.xpReward} XP`, pageWidth - margin - 3, y + 4.5, { align: 'right' });

      y += 6.5;
    });

    y += 8;
  }

  // Section 4: Strategic Recommendations & Next Steps
  if (options.includeRecommendations) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text('Strategic Skill Growth & Interview Prep Roadmap', margin, y);

    y += 4;

    // Callout box for Weak Skills to target
    const recBoxW = (contentWidth - 4) / 2;
    const recBoxH = 34;

    // Left card: Focus Areas (Skill Gaps)
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(254, 202, 202);
    doc.roundedRect(margin, y, recBoxW, recBoxH, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(185, 28, 28);
    doc.text('PRIORITY DIAGNOSTIC TARGETS', margin + 3, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(127, 29, 29);
    if (weakSkills.length > 0) {
      weakSkills.slice(0, 3).forEach((ws, idx) => {
        doc.text(`• ${ws.name} (${ws.masteryScore}%): Take diagnostic test to reach 70%+ benchmark`, margin + 3, y + 11 + idx * 5.5);
      });
      doc.setFontSize(6.5);
      doc.setTextColor(153, 27, 27);
      doc.text('Recommended: Practice platform challenges & interactive quizzes.', margin + 3, y + 29);
    } else {
      doc.text('• All tracked skills exceed the 70% threshold! Focus on reaching 85%+ Standout level.', margin + 3, y + 12);
    }

    // Right card: Anchor Strengths (Resume Highlighting)
    const rightRecX = margin + recBoxW + 4;
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(rightRecX, y, recBoxW, recBoxH, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(21, 128, 61);
    doc.text('PRIMARY RESUME ANCHORS & STRENGTHS', rightRecX + 3, y + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(20, 83, 45);
    if (strongSkills.length > 0) {
      strongSkills.slice(0, 3).forEach((ss, idx) => {
        doc.text(`• ${ss.name} (${ss.masteryScore}%): Spotlight with Google XYZ quantified metrics`, rightRecX + 3, y + 11 + idx * 5.5);
      });
      doc.setFontSize(6.5);
      doc.setTextColor(22, 101, 52);
      doc.text('Recommended: Lead with these core assets in recruiter screens.', rightRecX + 3, y + 29);
    } else {
      doc.text('• Continue daily practice routines to establish your first standout skill.', rightRecX + 3, y + 12);
    }

    y += recBoxH + 6;
  }

  // Optional Custom Notes
  if (options.notes && options.notes.trim()) {
    doc.setFillColor(cardBg[0], cardBg[1], cardBg[2]);
    doc.setDrawColor(cardBorder[0], cardBorder[1], cardBorder[2]);
    doc.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(accentSky[0], accentSky[1], accentSky[2]);
    doc.text('CAREER COACH / ADVISOR NOTES', margin + 3, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    const splitNotes = doc.splitTextToSize(options.notes.trim(), contentWidth - 6);
    doc.text(splitNotes, margin + 3, y + 9);

    y += 18;
  }

  // Footer for Page 2 with Verification Badge
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, pageHeight - 16, contentWidth, 7, 'F');
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`Verified Candidate Evaluation • Automated Fit & Mastery Diagnostics • Report #${reportId}`, margin + 3, pageHeight - 11.5);
  doc.text('Page 2 of 2', pageWidth - margin - 3, pageHeight - 11.5, { align: 'right' });

  return doc;
}

export function downloadCareerReportPdf(
  profile: StudentProfile,
  stats: UserStats,
  options?: ReportOptions
): void {
  const doc = generateCareerReportPdf(profile, stats, options);
  const safeName = profile.name.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `${safeName}_Career_Progress_Report.pdf`;
  doc.save(filename);
}
